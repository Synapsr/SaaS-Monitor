import "server-only";
import { eq } from "drizzle-orm";
import type { Transaction } from "@/db";
import { db } from "@/db";
import { stripeAccounts, type ScanProgress } from "@/db/schema";
import { DAY_SECONDS } from "@/lib/durations";
import { createCatalog } from "@/server/stripe/catalog";
import { applyCharges, applySubscriptionUpdates } from "./apply";
import { toUnixTime, type SyncContext } from "./context";
import { valueSubscription } from "./movements";

/*
 * A full scan reads every subscription, then the charges since a given date, one page at a time.
 * It serves two purposes:
 * - the initial import (`backfill`), which rebuilds each subscription's history;
 * - the daily reconcile, which fixes drift: events missed while the app was down for too long, or
 *   changes Stripe announces with no event at all, such as a repeating coupon that ends.
 *
 * Each page is written together with the scan's cursor, so a scan stopped by its time budget, a
 * restart or a serverless timeout resumes exactly where it was.
 */

export type ScanKind = "backfill" | "reconcile";

/** A year of payments covers every revenue metric and gives the feed its history. */
const IMPORTED_PAYMENT_DAYS = 365;

export function newScan(now: Date, paymentsSince: number | null): ScanProgress {
  return {
    phase: "subscriptions",
    cursor: null,
    startedAt: now.toISOString(),
    paymentsSince,
    subscriptions: 0,
    payments: 0,
  };
}

export function newBackfill(now: Date): ScanProgress {
  return newScan(now, toUnixTime(now) - IMPORTED_PAYMENT_DAYS * DAY_SECONDS);
}

export interface ScanResult {
  finished: boolean;
  /** Movements and payments written. */
  changes: number;
}

/** Scans pages until the scan is complete or the sync's time budget is spent. */
export async function runScan(
  context: SyncContext,
  kind: ScanKind,
  initial: ScanProgress,
): Promise<ScanResult> {
  const { account, gateway, now } = context;
  const nowSeconds = toUnixTime(now);
  const catalog = createCatalog(gateway, { bulk: true });
  let progress = initial;
  let changes = 0;

  // At least one page per run, so that a scan always makes progress.
  do {
    if (progress.phase === "subscriptions") {
      const page = await gateway.listSubscriptions(progress.cursor ?? undefined);
      const subscriptions = await catalog.complete(page.data);
      const updates = subscriptions.map((subscription) =>
        valueSubscription(subscription, catalog.coupons, nowSeconds),
      );
      const scanned = progress.subscriptions + page.data.length;
      const next: ScanProgress | null = hasNextPage(page)
        ? { ...progress, cursor: lastId(page.data), subscriptions: scanned }
        : progress.paymentsSince === null
          ? null
          : { ...progress, phase: "payments", cursor: null, subscriptions: scanned };

      changes += await db().transaction(async (tx) => {
        const written = await applySubscriptionUpdates(tx, account.id, updates, kind, nowSeconds);
        await saveProgress(tx, account.id, kind, next, progress);
        return written;
      });
      if (!next) return { finished: true, changes };
      progress = next;
    } else {
      // Scans without `paymentsSince` end with their subscriptions phase.
      const since = progress.paymentsSince ?? nowSeconds;
      const page = await gateway.listCharges(since, progress.cursor ?? undefined);
      const collected = page.data.filter((charge) => charge.collected).length;
      const next: ScanProgress | null = hasNextPage(page)
        ? { ...progress, cursor: lastId(page.data), payments: progress.payments + collected }
        : null;

      changes += await db().transaction(async (tx) => {
        const written = await applyCharges(tx, account.id, page.data, kind);
        await saveProgress(tx, account.id, kind, next, progress);
        return written;
      });
      if (!next) return { finished: true, changes };
      progress = next;
    }
  } while (Date.now() < context.deadline);

  return { finished: false, changes };
}

/** Saves the cursor, or completes the scan when `next` is `null`. */
async function saveProgress(
  tx: Transaction,
  accountId: string,
  kind: ScanKind,
  next: ScanProgress | null,
  current: ScanProgress,
) {
  const progress = kind === "backfill" ? { backfill: next } : { reconcile: next };
  const completion = next
    ? {}
    : {
        ...(kind === "backfill" && { status: "ready" as const }),
        // What changed after the scan started is replayed from the Events API.
        lastReconciledAt: new Date(current.startedAt),
      };
  await tx
    .update(stripeAccounts)
    .set({ ...progress, ...completion })
    .where(eq(stripeAccounts.id, accountId));
}

function hasNextPage(page: { data: readonly unknown[]; hasMore: boolean }): boolean {
  return page.hasMore && page.data.length > 0;
}

function lastId(items: readonly { id: string }[]): string | null {
  return items.at(-1)?.id ?? null;
}

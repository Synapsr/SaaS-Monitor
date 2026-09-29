import "server-only";
import { eq } from "drizzle-orm";
import type { Transaction } from "@/db";
import { db } from "@/db";
import { stripeAccounts, type ScanProgress, type ScanWindows } from "@/db/schema";
import { DAY_SECONDS } from "@/lib/durations";
import { createCatalog } from "@/server/stripe/catalog";
import { StripeAccessError } from "@/server/stripe/errors";
import type { Page } from "@/server/stripe/gateway";
import type { UnixTime } from "@/server/stripe/types";
import { applyCharges, applySubscriptionUpdates, endUnlistedSubscriptions } from "./apply";
import { toUnixTime, type SyncContext } from "./context";
import { couponArchive } from "./coupons";
import { applyCustomers } from "./customers";
import { valueSubscription } from "./movements";

/*
 * A full scan reads every subscription, then the charges and the customers created since given
 * dates, one page at a time. It serves two purposes:
 * - the initial import (`backfill`), which rebuilds each subscription's history;
 * - the daily reconcile, which fixes drift: events missed while the app was down for too long, or
 *   changes Stripe announces with no event at all, such as a repeating coupon that ends or test
 *   data deleted.
 *
 * Each page is written together with the scan's cursor, so a scan stopped by its time budget, a
 * restart or a serverless timeout resumes exactly where it was.
 */

export type ScanKind = "backfill" | "reconcile";

/** A year of payments covers every revenue metric and gives the feed its history. */
const IMPORTED_PAYMENT_DAYS = 365;
/**
 * Customers make no metric: screens show the latest ones in their feed and count today's. A week
 * covers today in every time zone and gives a new screen a few sign-ups to show, while every 100
 * customers cost a request: Stripe caps reads (see policy.ts), and busy products sign up
 * thousands a month.
 */
const IMPORTED_CUSTOMER_DAYS = 7;

export function newScan(
  now: Date,
  { paymentsSince, customersSince = null }: ScanWindows,
): ScanProgress {
  return {
    phase: "subscriptions",
    cursor: null,
    startedAt: now.toISOString(),
    paymentsSince,
    customersSince,
    subscriptions: 0,
    payments: 0,
    customers: 0,
  };
}

export function newBackfill(now: Date): ScanProgress {
  return newScan(now, {
    paymentsSince: toUnixTime(now) - IMPORTED_PAYMENT_DAYS * DAY_SECONDS,
    customersSince: recentCustomersSince(now),
  });
}

/** Creation time of the oldest customers worth importing (see `IMPORTED_CUSTOMER_DAYS`). */
export function recentCustomersSince(now: Date): UnixTime {
  return toUnixTime(now) - IMPORTED_CUSTOMER_DAYS * DAY_SECONDS;
}

/**
 * Scans pages until the scan is complete or the sync's time budget is spent. Returns the number
 * of movements, payments and customers written.
 */
export async function runScan(
  context: SyncContext,
  kind: ScanKind,
  initial: ScanProgress,
): Promise<number> {
  const { account, gateway, now } = context;
  const nowSeconds = toUnixTime(now);
  const catalog = createCatalog(gateway, { bulk: true, archive: couponArchive(account.id) });
  let progress = initial;
  let changes = 0;

  // At least one page per run, so that a scan always makes progress.
  do {
    if (progress.phase === "subscriptions") {
      const { page, restarted } = await listPage(
        (cursor) => gateway.listSubscriptions(cursor),
        progress.cursor,
      );
      if (restarted) progress = startedOver(progress, now);
      const subscriptions = await catalog.complete(page.data);
      const updates = subscriptions.map((subscription) =>
        valueSubscription(subscription, catalog.coupons, nowSeconds),
      );
      const scanned = { ...progress, subscriptions: progress.subscriptions + page.data.length };
      const next = hasNextPage(page)
        ? { ...scanned, cursor: lastId(page.data) }
        : afterPhase(scanned, now);

      changes += await db().transaction(async (tx) => {
        let written = await applySubscriptionUpdates(tx, account.id, updates, kind, nowSeconds);
        if (!page.hasMore) {
          // Stripe has listed every subscription it has: the others were deleted.
          const startedAt = toUnixTime(new Date(progress.startedAt));
          written += await endUnlistedSubscriptions(tx, account.id, startedAt, kind, nowSeconds);
        }
        await saveProgress(tx, account.id, kind, next, progress);
        return written;
      });
      if (!next) return changes;
      progress = next;
    } else if (progress.phase === "payments") {
      // Only scans with a window for payments get here (see `afterPhase`).
      const since = progress.paymentsSince ?? nowSeconds;
      const { page, restarted } = await listPage(
        (cursor) => gateway.listCharges(since, cursor),
        progress.cursor,
      );
      if (restarted) progress = startedOver(progress, now);
      const collected = page.data.filter((charge) => charge.collected).length;
      const scanned = { ...progress, payments: progress.payments + collected };
      const next = hasNextPage(page)
        ? { ...scanned, cursor: lastId(page.data) }
        : afterPhase(scanned, now);

      changes += await db().transaction(async (tx) => {
        const written = await applyCharges(tx, account.id, page.data, kind);
        await saveProgress(tx, account.id, kind, next, progress);
        return written;
      });
      if (!next) return changes;
      progress = next;
    } else {
      const since = progress.customersSince ?? nowSeconds;
      const { page, restarted } = await listPage(
        (cursor) => gateway.listCustomers(since, cursor),
        progress.cursor,
      );
      if (restarted) progress = startedOver(progress, now);
      const scanned = { ...progress, customers: (progress.customers ?? 0) + page.data.length };
      const next = hasNextPage(page)
        ? { ...scanned, cursor: lastId(page.data) }
        : afterPhase(scanned, now);

      changes += await db().transaction(async (tx) => {
        const written = await applyCustomers(tx, account.id, { created: page.data }, kind);
        await saveProgress(tx, account.id, kind, next, progress);
        return written;
      });
      if (!next) return changes;
      progress = next;
    }
  } while (Date.now() < context.deadline);

  return changes;
}

/**
 * Lists the page after `cursor`. A scan spread over several runs can outlive its cursor's object
 * (e.g. test data deleted in between), which Stripe then rejects: the phase restarts from its
 * first page instead of failing forever. Pages are idempotent, so reading some twice is harmless.
 */
async function listPage<T>(
  list: (cursor: string | undefined) => Promise<Page<T>>,
  cursor: string | null,
): Promise<{ page: Page<T>; restarted: boolean }> {
  try {
    return { page: await list(cursor ?? undefined), restarted: false };
  } catch (error) {
    const unknownCursor = error instanceof StripeAccessError && error.kind === "not_found";
    if (!cursor || !unknownCursor) throw error;
    return { page: await list(undefined), restarted: true };
  }
}

/**
 * The progress of a phase listed again from its first page. A subscriptions listing started over
 * only vouches for what it lists from now on: subscriptions it saw before may have been deleted.
 */
function startedOver(progress: ScanProgress, now: Date): ScanProgress {
  switch (progress.phase) {
    case "subscriptions":
      return { ...progress, cursor: null, startedAt: now.toISOString(), subscriptions: 0 };
    case "payments":
      return { ...progress, cursor: null, payments: 0 };
    case "customers":
      return { ...progress, cursor: null, customers: 0 };
  }
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

/**
 * What comes after the last page of a phase: payments, then customers, each when the scan has a
 * window for it. Scans saved before customers were imported have none for them.
 */
function afterPhase(progress: ScanProgress, now: Date): ScanProgress | null {
  const start = (phase: ScanProgress["phase"]) => ({ ...progress, phase, cursor: null });
  if (progress.phase === "subscriptions" && progress.paymentsSince !== null) {
    return start("payments");
  }
  if (progress.phase !== "customers" && (progress.customersSince ?? null) !== null) {
    return start("customers");
  }
  return afterLastPage(progress, now);
}

/** What comes after the last page: nothing, or the scan a catch-up asked for meanwhile. */
function afterLastPage(progress: ScanProgress, now: Date): ScanProgress | null {
  return progress.followUp ? newScan(now, progress.followUp) : null;
}

function hasNextPage(page: { data: readonly unknown[]; hasMore: boolean }): boolean {
  return page.hasMore && page.data.length > 0;
}

function lastId(items: readonly { id: string }[]): string | null {
  return items.at(-1)?.id ?? null;
}

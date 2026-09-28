import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { stripeAccounts, subscriptions, type ScanProgress } from "@/db/schema";
import { createCatalog } from "@/server/stripe/catalog";
import { SYNC_EVENT_TYPES } from "@/server/stripe/event-types";
import type { Subscription } from "@/server/stripe/types";
import { applyCharges, applySubscriptionUpdates, type SubscriptionUpdate } from "./apply";
import { DAY_SECONDS, toUnixTime, type SyncContext } from "./context";
import { digestEvents, emptyDigest, type EventDigest, type EventRef } from "./events";
import { valueSubscription } from "./movements";
import { newScan } from "./scan";

/*
 * The incremental sync reads what happened since the last sync from the Events API. Subscription
 * and discount events only say which subscriptions changed: each one is fetched again and its new
 * MRR compared with the mirror, so replaying an event changes nothing. Charges are read from the
 * event payloads.
 */

/** Stripe may list an event a little after its timestamp: re-read a few minutes each time. */
const CURSOR_OVERLAP_SECONDS = 5 * 60;
/** Stripe keeps events for 30 days: past 25 days without a sync, catch up with a full scan. */
const MAX_CURSOR_AGE_SECONDS = 25 * DAY_SECONDS;
/** Past this many pages of events, a full scan catches up with fewer requests. */
const MAX_EVENT_PAGES = 20;
/**
 * Fetching a subscription costs a request while a full scan reads 100 per request: past this many
 * changed subscriptions, a scan is cheaper. It also avoids a burst of celebrations after downtime.
 */
const MAX_REFETCHED_SUBSCRIPTIONS = 50;

export interface IncrementalResult {
  /** Movements and payments written. */
  changes: number;
  /** A full scan this sync should run to catch up, when events alone are not enough. */
  catchUp: ScanProgress | null;
}

export async function runIncremental(context: SyncContext): Promise<IncrementalResult> {
  const { account, now } = context;
  const nowSeconds = toUnixTime(now);
  const cursor = account.eventsCursor;
  const since = (cursor ?? nowSeconds - MAX_CURSOR_AGE_SECONDS) - CURSOR_OVERLAP_SECONDS;

  // Events may have expired, or be too many to read: scan subscriptions and charges instead, and
  // only read the events that come next.
  const digest =
    cursor !== null && nowSeconds - cursor <= MAX_CURSOR_AGE_SECONDS
      ? await readEvents(context, since)
      : null;
  if (!digest) {
    return {
      changes: 0,
      catchUp: await startCatchUp(context, { paymentsSince: since, eventsCursor: nowSeconds }),
    };
  }

  const changed = await changedSubscriptions(account.id, digest);
  if (changed.size > MAX_REFETCHED_SUBSCRIPTIONS) {
    // Charges were read from the events: the scan only needs to cover subscriptions.
    const changes = await applyEvents(context, digest, []);
    return { changes, catchUp: await startCatchUp(context, { paymentsSince: null }) };
  }

  const fetched: Subscription[] = [];
  for (const id of changed.keys()) {
    // A subscription only vanishes when test data is deleted: nothing left to update then.
    const subscription = await context.gateway.retrieveSubscription(id);
    if (subscription) fetched.push(subscription);
  }
  const catalog = createCatalog(context.gateway, { bulk: false });
  const updates = (await catalog.complete(fetched)).map((subscription) => ({
    ...valueSubscription(subscription, catalog.coupons, nowSeconds),
    event: changed.get(subscription.id),
  }));

  return { changes: await applyEvents(context, digest, updates), catchUp: null };
}

/** Lists the events since `since`, or returns `null` when there are too many to be worth it. */
async function readEvents(context: SyncContext, since: number): Promise<EventDigest | null> {
  const digest = emptyDigest();
  let startingAfter: string | undefined;
  for (let pages = 1; ; pages += 1) {
    const page = await context.gateway.listEvents(SYNC_EVENT_TYPES, since, startingAfter);
    digestEvents(digest, page.data);
    if (!page.hasMore || page.data.length === 0) return digest;
    if (pages >= MAX_EVENT_PAGES) return null;
    startingAfter = page.data[page.data.length - 1].id;
  }
}

/**
 * Subscriptions to fetch again: the ones events name, and those of customers whose discount
 * changed.
 */
async function changedSubscriptions(
  accountId: string,
  digest: EventDigest,
): Promise<Map<string, EventRef>> {
  const changed = new Map(digest.subscriptions);
  if (!digest.customers.size) return changed;

  const rows = await db()
    .select({ id: subscriptions.stripeSubscriptionId, customerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.accountId, accountId),
        inArray(subscriptions.stripeCustomerId, [...digest.customers.keys()]),
      ),
    );
  for (const row of rows) {
    const event = digest.customers.get(row.customerId);
    const known = changed.get(row.id);
    if (event && (!known || event.created > known.created)) changed.set(row.id, event);
  }
  return changed;
}

/** Writes charges and subscription changes, then moves the cursor, in one transaction. */
async function applyEvents(
  context: SyncContext,
  digest: EventDigest,
  updates: readonly SubscriptionUpdate[],
): Promise<number> {
  const { account, now } = context;
  const charges = [...digest.charges.values()].map(({ charge }) => charge);
  return db().transaction(async (tx) => {
    const written =
      (await applyCharges(tx, account.id, charges, "live")) +
      (await applySubscriptionUpdates(tx, account.id, updates, "live", toUnixTime(now)));
    if (digest.newest) {
      const newest = digest.newest.created;
      const newestAt = new Date(newest * 1000).toISOString();
      await tx
        .update(stripeAccounts)
        .set({
          eventsCursor: sql`greatest(${stripeAccounts.eventsCursor}, ${newest})`,
          lastEventAt: sql`greatest(${stripeAccounts.lastEventAt}, ${newestAt}::timestamptz)`,
        })
        .where(eq(stripeAccounts.id, account.id));
    }
    return written;
  });
}

/**
 * Starts (or restarts) a reconcile covering what events could not. When events are skipped, the
 * cursor moves to now: new events are applied as usual while the scan runs.
 */
async function startCatchUp(
  context: SyncContext,
  { paymentsSince, eventsCursor }: { paymentsSince: number | null; eventsCursor?: number },
): Promise<ScanProgress> {
  const { account, now } = context;
  // A reconcile already under way restarts, still covering the payments it was due to import.
  const since = [paymentsSince, account.reconcile?.paymentsSince ?? null].filter(
    (time): time is number => time !== null,
  );
  const scan = newScan(now, since.length ? Math.min(...since) : null);
  await db()
    .update(stripeAccounts)
    .set({ reconcile: scan, ...(eventsCursor !== undefined && { eventsCursor }) })
    .where(eq(stripeAccounts.id, account.id));
  return scan;
}

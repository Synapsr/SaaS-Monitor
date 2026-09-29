import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { stripeAccounts, subscriptions, type ScanProgress, type ScanWindows } from "@/db/schema";
import { DAY_SECONDS } from "@/lib/durations";
import { createCatalog } from "@/server/stripe/catalog";
import { SYNC_EVENT_TYPES } from "@/server/stripe/event-types";
import type { Subscription } from "@/server/stripe/types";
import {
  applyCharges,
  applySubscriptionUpdates,
  endMissingSubscriptions,
  type SubscriptionUpdate,
} from "./apply";
import { toUnixTime, type SyncContext } from "./context";
import { couponArchive } from "./coupons";
import { applyCustomers, deleteCustomers } from "./customers";
import { digestEvents, emptyDigest, type EventDigest, type EventRef } from "./events";
import { valueSubscription } from "./movements";
import { newScan, recentCustomersSince } from "./scan";

/*
 * The incremental sync reads what happened since the last sync from the Events API. Subscription
 * and discount events only say which subscriptions changed: each one is fetched again and its new
 * MRR compared with the mirror, so replaying an event changes nothing. Charges and customers are
 * read from the event payloads.
 */

/**
 * Stripe may list an event a little after its timestamp: re-read a few minutes each time. The
 * events already handled there are remembered and skipped, so a quiet sync costs one request.
 */
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
  /** Movements, payments and customers written. */
  changes: number;
  /** A full scan this sync should run to catch up, when events alone are not enough. */
  catchUp: ScanProgress | null;
}

export async function runIncremental(context: SyncContext): Promise<IncrementalResult> {
  const { account, now } = context;
  const nowSeconds = toUnixTime(now);
  const cursor = account.eventsCursor;
  const since = (cursor ?? nowSeconds - MAX_CURSOR_AGE_SECONDS) - CURSOR_OVERLAP_SECONDS;

  // Events may have expired, or be too many to read: scan subscriptions, charges and customers
  // instead, and only read the events that come next. Customers older than those of an import
  // are not worth their requests.
  const digest =
    cursor !== null && nowSeconds - cursor <= MAX_CURSOR_AGE_SECONDS
      ? await readEvents(context, since, new Set(account.recentEventIds))
      : null;
  if (!digest) {
    const windows = {
      paymentsSince: since,
      customersSince: Math.max(since, recentCustomersSince(now)),
    };
    return { changes: 0, catchUp: await startCatchUp(context, windows, nowSeconds) };
  }

  const changed = await changedSubscriptions(account.id, digest);
  if (changed.size > MAX_REFETCHED_SUBSCRIPTIONS) {
    // Charges and customers were read from the events: the scan only needs to cover subscriptions.
    const changes = await applyEvents(context, digest, [], new Map());
    const windows = { paymentsSince: null, customersSince: null };
    return { changes, catchUp: await startCatchUp(context, windows) };
  }

  const fetched: Subscription[] = [];
  const missing = new Map<string, EventRef>();
  for (const [id, event] of changed) {
    const subscription = await context.gateway.retrieveSubscription(id);
    if (subscription) fetched.push(subscription);
    else missing.set(id, event);
  }
  const catalog = createCatalog(context.gateway, {
    bulk: false,
    archive: couponArchive(account.id),
  });
  const updates = (await catalog.complete(fetched)).map((subscription) => ({
    ...valueSubscription(subscription, catalog.coupons, nowSeconds),
    event: changed.get(subscription.id),
  }));

  return { changes: await applyEvents(context, digest, updates, missing), catchUp: null };
}

/**
 * Lists the events since `since`, skipping those `handled` by an earlier sync, or returns `null`
 * when there are too many to be worth it.
 */
async function readEvents(
  context: SyncContext,
  since: number,
  handled: ReadonlySet<string>,
): Promise<EventDigest | null> {
  const digest = emptyDigest();
  let startingAfter: string | undefined;
  for (let pages = 1; ; pages += 1) {
    const page = await context.gateway.listEvents(SYNC_EVENT_TYPES, since, startingAfter);
    digestEvents(digest, page.data, handled);
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
  if (!digest.customerDiscounts.size) return changed;

  const rows = await db()
    .select({ id: subscriptions.stripeSubscriptionId, customerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.accountId, accountId),
        inArray(subscriptions.stripeCustomerId, [...digest.customerDiscounts.keys()]),
      ),
    );
  for (const row of rows) {
    const event = digest.customerDiscounts.get(row.customerId);
    const known = changed.get(row.id);
    if (event && (!known || event.created > known.created)) changed.set(row.id, event);
  }
  return changed;
}

/**
 * Writes charges, customers and subscription changes, then moves the cursor, in one transaction.
 * `missing` are the subscriptions Stripe no longer has, with their latest event. Every event
 * listed counts as handled, including those whose subscription a catch-up scan covers instead.
 */
async function applyEvents(
  context: SyncContext,
  digest: EventDigest,
  updates: readonly SubscriptionUpdate[],
  missing: ReadonlyMap<string, EventRef>,
): Promise<number> {
  const { account, now } = context;
  const charges = [...digest.charges.values()].map(({ charge }) => charge);
  const customers = [...digest.customers.values()];
  const created = customers.filter((change) => change.created).map(({ customer }) => customer);
  const updated = customers.filter((change) => !change.created).map(({ customer }) => customer);
  return db().transaction(async (tx) => {
    const written =
      (await applyCharges(tx, account.id, charges, "live")) +
      (await applyCustomers(tx, account.id, { created, updated }, "live")) +
      (await deleteCustomers(tx, account.id, [...digest.deletedCustomers])) +
      (await applySubscriptionUpdates(tx, account.id, updates, "live", toUnixTime(now))) +
      (await endMissingSubscriptions(tx, account.id, missing, toUnixTime(now)));
    if (digest.newest) {
      const newest = digest.newest.created;
      // The next sync reads from a few minutes before the cursor: it skips these.
      const rereadSince = Math.max(account.eventsCursor ?? newest, newest) - CURSOR_OVERLAP_SECONDS;
      await tx
        .update(stripeAccounts)
        .set({
          eventsCursor: forwardTo(stripeAccounts.eventsCursor, newest),
          lastEventAt: forwardTo(stripeAccounts.lastEventAt, new Date(newest * 1000)),
          recentEventIds: digest.listed
            .filter((event) => event.created >= rereadSince)
            .map((event) => event.id),
        })
        .where(eq(stripeAccounts.id, account.id));
    }
    return written;
  });
}

/**
 * Moves `column` forward to `value`, never back: another sync may have gone further meanwhile.
 * MySQL's `greatest()` is null as soon as one of its values is.
 */
function forwardTo(column: AnyMySqlColumn, value: unknown) {
  const param = sql.param(value, column);
  return sql`greatest(coalesce(${column}, ${param}), ${param})`;
}

/**
 * Starts a reconcile covering what events could not: every subscription, and the charges and
 * customers `windows` ask for. When events are skipped, the cursor moves to `eventsCursor` (now):
 * new events are applied as usual while the scan runs.
 *
 * A reconcile already under way goes on rather than restarting, or bursts of events could keep it
 * from ever completing. If it has scanned pages already, those may predate the changes to catch
 * up with: a follow-up scan checks every subscription again once it completes.
 */
async function startCatchUp(
  context: SyncContext,
  windows: ScanWindows,
  eventsCursor?: number,
): Promise<ScanProgress> {
  const { account, now } = context;
  const current = account.reconcile;
  let scan: ScanProgress;
  if (!current) {
    scan = newScan(now, windows);
  } else if (current.phase === "subscriptions" && current.cursor === null) {
    scan = { ...current, ...widest(current, windows) };
  } else {
    scan = { ...current, followUp: widest(current.followUp, windows) };
  }
  await db()
    .update(stripeAccounts)
    .set({
      reconcile: scan,
      ...(eventsCursor !== undefined && { eventsCursor, recentEventIds: [] }),
    })
    .where(eq(stripeAccounts.id, account.id));
  return scan;
}

/** Windows covering those of both scans, the first of which may not exist yet. */
function widest(a: ScanWindows | undefined, b: ScanWindows): ScanWindows {
  return {
    paymentsSince: earliest(a?.paymentsSince, b.paymentsSince),
    customersSince: earliest(a?.customersSince, b.customersSince),
  };
}

/** The earlier of two times, where `null` (or its absence) means nothing to import. */
function earliest(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a === null || a === undefined) return b ?? null;
  return b === null || b === undefined ? a : Math.min(a, b);
}

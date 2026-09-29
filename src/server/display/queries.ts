import "server-only";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  inArray,
  sql,
  sum,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  mrrMovements,
  payments,
  screenAccounts,
  screens,
  stripeAccounts,
  subscriptions,
} from "@/db/schema";
import { dayToUtcDate } from "@/lib/display/calendar";
import type { FeedItemKind } from "@/lib/display/types";
import { DAY_MS } from "@/lib/durations";

/*
 * The few queries behind a display. Days are bucketed by MySQL in the screen's time zone
 * (`CONVERT_TZ`, whose time zone tables know daylight saving); the coarse timestamp bounds keep
 * them on the `(account_id, occurred_at)` indexes. Figures are grouped by account: a screen shows
 * each of its accounts on its own too.
 */

/**
 * A moment surely before `day` starts in any time zone (UTC+14 is the earliest), so that queries
 * can use their timestamp index before filtering on local days.
 */
function instantBefore(day: string): Date {
  return new Date(dayToUtcDate(day).getTime() - DAY_MS);
}

export async function findScreen(token: string) {
  const [screen] = await db()
    .select({
      id: screens.id,
      name: screens.name,
      settings: screens.settings,
      testEventAt: screens.testEventAt,
    })
    .from(screens)
    .where(eq(screens.publicToken, token));
  return screen ?? null;
}

export function linkedAccounts(screenId: string) {
  return db()
    .select({
      id: stripeAccounts.id,
      name: stripeAccounts.name,
      status: stripeAccounts.status,
      livemode: stripeAccounts.livemode,
      lastError: stripeAccounts.lastError,
    })
    .from(screenAccounts)
    .innerJoin(stripeAccounts, eq(stripeAccounts.id, screenAccounts.accountId))
    .where(eq(screenAccounts.screenId, screenId))
    .orderBy(asc(stripeAccounts.createdAt));
}

/**
 * Counts per account. A customer belongs to a single account: counts of several accounts add up.
 */
function countsByAccount(rows: readonly { accountId: string; count: number }[]) {
  return new Map(rows.map((row) => [row.accountId, row.count]));
}

/** Current MRR and trials per account and currency. */
export function subscriptionTotals(accountIds: string[]) {
  return db()
    .select({
      accountId: subscriptions.accountId,
      currency: subscriptions.currency,
      mrr: sum(subscriptions.mrr).mapWith(Number),
      trialing: count(sql`case when ${subscriptions.status} = 'trialing' then 1 end`),
    })
    .from(subscriptions)
    .where(inArray(subscriptions.accountId, accountIds))
    .groupBy(subscriptions.accountId, subscriptions.currency);
}

/** Customers with at least one paying subscription, per account. */
export async function payingCustomerCounts(accountIds: string[]): Promise<Map<string, number>> {
  const rows = await db()
    .select({
      accountId: subscriptions.accountId,
      count: countDistinct(subscriptions.stripeCustomerId),
    })
    .from(subscriptions)
    .where(and(inArray(subscriptions.accountId, accountIds), gt(subscriptions.mrr, 0)))
    .groupBy(subscriptions.accountId);
  return countsByAccount(rows);
}

/** The calendar day of an instant (stored in UTC) in the screen's time zone. */
function localDay(instant: AnyColumn, timeZone: string) {
  return sql<string>`date(convert_tz(${instant}, '+00:00', ${timeZone}))`;
}

/** A day as `YYYY-MM-DD` text, like `SeriesPoint.date`. */
function dayText(day: SQL.Aliased<string>) {
  return sql<string>`date_format(${day}, '%Y-%m-%d')`;
}

/**
 * Net MRR change per account, currency, kind and local day, from `from` on, or since the first
 * movement when `from` is `null`: all time, whose chart starts with it.
 */
export function movementsByDay(accountIds: string[], timeZone: string, from: string | null) {
  const local = db()
    .$with("local_movements")
    .as(
      db()
        .select({
          accountId: mrrMovements.accountId,
          currency: mrrMovements.currency,
          kind: mrrMovements.kind,
          amount: mrrMovements.amount,
          day: localDay(mrrMovements.occurredAt, timeZone).as("day"),
        })
        .from(mrrMovements)
        .where(
          and(
            inArray(mrrMovements.accountId, accountIds),
            from === null ? undefined : gte(mrrMovements.occurredAt, instantBefore(from)),
          ),
        ),
    );
  return db()
    .with(local)
    .select({
      accountId: local.accountId,
      currency: local.currency,
      kind: local.kind,
      day: dayText(local.day),
      amount: sql<number>`sum(${local.amount})`.mapWith(Number),
    })
    .from(local)
    .where(from === null ? undefined : gte(local.day, from))
    .groupBy(local.accountId, local.currency, local.kind, local.day);
}

/**
 * Net revenue (payments minus refunds, and the fees of those made for Stripe Connect accounts)
 * per account, currency and local day, from `from` on.
 */
export function revenueByDay(accountIds: string[], timeZone: string, from: string) {
  const local = db()
    .$with("local_payments")
    .as(
      db()
        .select({
          accountId: payments.accountId,
          currency: payments.currency,
          // A payment made for a Stripe Connect account is theirs: the account earns its fee,
          // unless the payment was refunded in full.
          net: sql<number>`case
            when ${payments.connectedAccountId} is null then ${payments.amount} - ${payments.amountRefunded}
            when ${payments.amountRefunded} < ${payments.amount} then coalesce(${payments.applicationFee}, 0)
            else 0
          end`.as("net"),
          day: localDay(payments.occurredAt, timeZone).as("day"),
        })
        .from(payments)
        .where(
          and(
            inArray(payments.accountId, accountIds),
            gte(payments.occurredAt, instantBefore(from)),
          ),
        ),
    );
  return db()
    .with(local)
    .select({
      accountId: local.accountId,
      currency: local.currency,
      day: dayText(local.day),
      amount: sql<number>`sum(${local.net})`.mapWith(Number),
    })
    .from(local)
    .where(gte(local.day, from))
    .groupBy(local.accountId, local.currency, local.day);
}

/**
 * Customers who started paying this month, per account: a new subscription, while they paid
 * nothing when the month began. A customer adding a second subscription is not a new customer.
 */
export async function newCustomerCounts(
  accountIds: string[],
  timeZone: string,
  monthStart: string,
): Promise<Map<string, number>> {
  const { accountId, stripeCustomerId, amount, kind, occurredAt } = mrrMovements;
  const thisMonth = gte(localDay(occurredAt, timeZone), monthStart);

  // Customers with movements this month, under new names since they are joined with the ledger.
  const touched = db()
    .$with("touched_customers")
    .as(
      db()
        .selectDistinct({
          accountId: sql<string>`${accountId}`.as("touched_account_id"),
          customerId: sql<string>`${stripeCustomerId}`.as("touched_customer_id"),
        })
        .from(mrrMovements)
        .where(
          and(
            inArray(accountId, accountIds),
            gte(occurredAt, instantBefore(monthStart)),
            thisMonth,
          ),
        ),
    );
  // Their MRR when the month began, and whether they started a subscription since.
  const months = db()
    .$with("customer_months")
    .as(
      db()
        .select({
          accountId,
          mrrBefore: sql<number>`sum(if(${thisMonth}, 0, ${amount}))`.as("mrr_before"),
          // Conditions are 0 or 1 in MySQL: the largest says whether any of them holds.
          started: sql<boolean>`max(${kind} = 'new' and ${thisMonth})`.as("started"),
        })
        .from(mrrMovements)
        .innerJoin(
          touched,
          and(eq(accountId, touched.accountId), eq(stripeCustomerId, touched.customerId)),
        )
        .groupBy(accountId, stripeCustomerId),
    );

  const rows = await db()
    .with(touched, months)
    .select({ accountId: months.accountId, count: count() })
    .from(months)
    .where(sql`${months.started} and ${months.mrrBefore} = 0`)
    .groupBy(months.accountId);
  return countsByAccount(rows);
}

/**
 * Customers created per account since the local day `day` began: today's sign-ups. Later days
 * only hold customers dated ahead by Stripe's clock, which count today like movements do.
 */
export async function customersCreatedSince(
  accountIds: string[],
  timeZone: string,
  day: string,
): Promise<Map<string, number>> {
  const rows = await db()
    .select({ accountId: customers.accountId, count: count() })
    .from(customers)
    .where(
      and(
        inArray(customers.accountId, accountIds),
        gte(customers.occurredAt, instantBefore(day)),
        gte(localDay(customers.occurredAt, timeZone), day),
      ),
    )
    .groupBy(customers.accountId);
  return countsByAccount(rows);
}

/** A movement, payment or new customer of the feed, before conversion to the screen's currency. */
export interface ActivityRow {
  source: "movement" | "payment" | "customer";
  id: string;
  kind: FeedItemKind;
  /** 0 for a customer, who pays nothing by signing up. */
  amount: number;
  /** `null` for a customer: there is no amount to convert. */
  currency: string | null;
  occurredAt: Date;
  origin: "backfill" | "live" | "reconcile";
  accountId: string;
  /** Stripe's id: it never leaves the server (see `toFeedItem`). */
  customerId: string | null;
  customerName: string | null;
  country: string | null;
  planName: string | null;
  /** For a payment made for a Stripe Connect account: that account's id. */
  connectedAccountId: string | null;
  /** What the account keeps of such a payment. */
  applicationFee: number | null;
}

/** Newest first, and rows of the same instant by descending id, like the queries below. */
function newestFirst(a: { occurredAt: Date; id: string }, b: { occurredAt: Date; id: string }) {
  return b.occurredAt.getTime() - a.occurredAt.getTime() || b.id.localeCompare(a.id);
}

/** An account's latest movements, newest first. */
function latestMovements(accountId: string, limit: number) {
  return db()
    .select({
      id: mrrMovements.id,
      kind: mrrMovements.kind,
      amount: mrrMovements.amount,
      currency: mrrMovements.currency,
      occurredAt: mrrMovements.occurredAt,
      origin: mrrMovements.origin,
      accountId: mrrMovements.accountId,
      customerId: mrrMovements.stripeCustomerId,
      customerName: mrrMovements.customerName,
      country: mrrMovements.customerCountry,
      planName: mrrMovements.planName,
    })
    .from(mrrMovements)
    .where(eq(mrrMovements.accountId, accountId))
    .orderBy(desc(mrrMovements.occurredAt), desc(mrrMovements.id))
    .limit(limit);
}

/**
 * An account's latest payments, newest first, net of refunds. Fully refunded payments are not
 * worth showing.
 */
function latestPayments(accountId: string, limit: number) {
  return db()
    .select({
      id: payments.id,
      amount: sql<number>`${payments.amount} - ${payments.amountRefunded}`.mapWith(Number),
      currency: payments.currency,
      occurredAt: payments.occurredAt,
      origin: payments.origin,
      accountId: payments.accountId,
      customerName: payments.customerName,
      country: payments.customerCountry,
      customerId: payments.stripeCustomerId,
      connectedAccountId: payments.connectedAccountId,
      applicationFee: payments.applicationFee,
    })
    .from(payments)
    .where(and(eq(payments.accountId, accountId), gt(payments.amount, payments.amountRefunded)))
    .orderBy(desc(payments.occurredAt), desc(payments.id))
    .limit(limit);
}

/** An account's latest customers, newest first. */
function latestCustomers(accountId: string, limit: number) {
  return db()
    .select({
      id: customers.id,
      occurredAt: customers.occurredAt,
      origin: customers.origin,
      accountId: customers.accountId,
      customerId: customers.stripeCustomerId,
      customerName: customers.name,
      country: customers.country,
    })
    .from(customers)
    .where(eq(customers.accountId, accountId))
    .orderBy(desc(customers.occurredAt), desc(customers.id))
    .limit(limit);
}

/**
 * The `limit` newest rows of the screen's accounts, read with one query per account: each one's
 * come from the end of its `(account_id, occurred_at)` index, while a condition on several
 * accounts would read and sort their whole history. Screens show a few accounts at most.
 */
async function newestOfEachAccount<Row extends { occurredAt: Date; id: string }>(
  accountIds: readonly string[],
  limit: number,
  latest: (accountId: string, limit: number) => Promise<Row[]>,
): Promise<Row[]> {
  const rows = await Promise.all(accountIds.map((accountId) => latest(accountId, limit)));
  return rows.flat().sort(newestFirst).slice(0, limit);
}

/** The latest movements, payments and new customers, newest first. */
export async function latestActivity(accountIds: string[], limit: number): Promise<ActivityRow[]> {
  const [movementRows, paymentRows, customerRows] = await Promise.all([
    newestOfEachAccount(accountIds, limit, latestMovements),
    newestOfEachAccount(accountIds, limit, latestPayments),
    newestOfEachAccount(accountIds, limit, latestCustomers),
  ]);

  const profiles = await customerProfiles(
    accountIds,
    paymentRows.flatMap((row) => (row.customerId ? [row.customerId] : [])),
  );
  const rows: ActivityRow[] = [
    ...movementRows.map((row) => ({
      ...row,
      source: "movement" as const,
      connectedAccountId: null,
      applicationFee: null,
    })),
    ...paymentRows.map((row) => {
      const profile = row.customerId ? profiles.get(`${row.accountId}:${row.customerId}`) : null;
      return {
        ...row,
        source: "payment" as const,
        kind: "payment" as const,
        planName: profile?.planName ?? null,
        // A charge only knows its card and billing details: the card may come from another
        // country, so the customer's own profile names them like their subscription does.
        customerName: profile?.customerName ?? row.customerName,
        country: profile?.country ?? row.country,
      };
    }),
    ...customerRows.map((row) => ({
      ...row,
      source: "customer" as const,
      kind: "customer" as const,
      amount: 0,
      currency: null,
      planName: null,
      connectedAccountId: null,
      applicationFee: null,
    })),
  ];
  return rows.sort(newestFirst).slice(0, limit);
}

/**
 * Charges don't say which plan they pay for, and their billing details may differ from the
 * customer's: describe each customer as their main subscription does (the one bringing the most
 * MRR, then the latest), keyed by `<account id>:<customer id>`.
 */
async function customerProfiles(accountIds: string[], customerIds: string[]) {
  const profiles = new Map<
    string,
    { planName: string | null; customerName: string | null; country: string | null }
  >();
  if (!customerIds.length) return profiles;

  const rows = await db()
    .select({
      accountId: subscriptions.accountId,
      customerId: subscriptions.stripeCustomerId,
      planName: subscriptions.planName,
      customerName: subscriptions.customerName,
      country: subscriptions.customerCountry,
    })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.accountId, accountIds),
        inArray(subscriptions.stripeCustomerId, [...new Set(customerIds)]),
      ),
    )
    .orderBy(desc(subscriptions.mrr), desc(subscriptions.startedAt));
  for (const { accountId, customerId, ...profile } of rows) {
    const key = `${accountId}:${customerId}`;
    if (!profiles.has(key)) profiles.set(key, profile);
  }
  return profiles;
}

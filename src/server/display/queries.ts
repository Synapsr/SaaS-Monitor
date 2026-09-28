import "server-only";
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  sql,
  sum,
  type AnyColumn,
} from "drizzle-orm";
import { db } from "@/db";
import {
  mrrMovements,
  payments,
  screenAccounts,
  screens,
  stripeAccounts,
  subscriptions,
} from "@/db/schema";
import { dayToUtcDate } from "@/lib/display/calendar";
import type { MrrMovementKind } from "@/lib/display/types";
import { DAY_MS } from "@/lib/durations";

/*
 * The few queries behind a display. Days are bucketed by PostgreSQL in the screen's time zone
 * (`AT TIME ZONE`), which handles daylight saving; the coarse timestamp bounds keep them on the
 * `(account_id, occurred_at)` indexes.
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

/** Current MRR and subscription counts per account and currency. */
export function subscriptionTotals(accountIds: string[]) {
  const { mrr, status } = subscriptions;
  return db()
    .select({
      accountId: subscriptions.accountId,
      currency: subscriptions.currency,
      mrr: sum(mrr).mapWith(Number),
      paying: sql<number>`count(*) filter (where ${mrr} > 0)`.mapWith(Number),
      trialing: sql<number>`count(*) filter (where ${status} = 'trialing')`.mapWith(Number),
    })
    .from(subscriptions)
    .where(inArray(subscriptions.accountId, accountIds))
    .groupBy(subscriptions.accountId, subscriptions.currency);
}

/** Customers with at least one paying subscription. */
export async function payingCustomerCount(accountIds: string[]): Promise<number> {
  const [row] = await db()
    .select({
      count: countDistinct(sql`(${subscriptions.accountId}, ${subscriptions.stripeCustomerId})`),
    })
    .from(subscriptions)
    .where(and(inArray(subscriptions.accountId, accountIds), gt(subscriptions.mrr, 0)));
  return row?.count ?? 0;
}

/** The calendar day of a timestamp in the screen's time zone. */
function localDay(timestamp: AnyColumn, timeZone: string) {
  return sql<string>`(${timestamp} at time zone ${timeZone})::date`;
}

/** Net MRR change per currency, kind and local day, from `from` on. */
export function movementsByDay(accountIds: string[], timeZone: string, from: string) {
  const local = db()
    .$with("local_movements")
    .as(
      db()
        .select({
          currency: mrrMovements.currency,
          kind: mrrMovements.kind,
          amount: mrrMovements.amount,
          day: localDay(mrrMovements.occurredAt, timeZone).as("day"),
        })
        .from(mrrMovements)
        .where(
          and(
            inArray(mrrMovements.accountId, accountIds),
            gte(mrrMovements.occurredAt, instantBefore(from)),
          ),
        ),
    );
  return db()
    .with(local)
    .select({
      currency: local.currency,
      kind: local.kind,
      day: sql<string>`${local.day}::text`,
      amount: sql<number>`sum(${local.amount})`.mapWith(Number),
    })
    .from(local)
    .where(sql`${local.day} >= ${from}::date`)
    .groupBy(local.currency, local.kind, local.day);
}

/** Net revenue (payments minus refunds) per currency and local day, from `from` on. */
export function revenueByDay(accountIds: string[], timeZone: string, from: string) {
  const local = db()
    .$with("local_payments")
    .as(
      db()
        .select({
          currency: payments.currency,
          net: sql<number>`${payments.amount} - ${payments.amountRefunded}`.as("net"),
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
      currency: local.currency,
      day: sql<string>`${local.day}::text`,
      amount: sql<number>`sum(${local.net})`.mapWith(Number),
    })
    .from(local)
    .where(sql`${local.day} >= ${from}::date`)
    .groupBy(local.currency, local.day);
}

/**
 * Customers who started paying this month (paying nothing when it began) and customers who
 * stopped paying altogether: a customer dropping one of two subscriptions has not churned.
 */
export async function customerChanges(accountIds: string[], timeZone: string, monthStart: string) {
  const { accountId, stripeCustomerId, amount, kind, occurredAt } = mrrMovements;
  const thisMonth = sql`${localDay(occurredAt, timeZone)} >= ${monthStart}::date`;

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
  // Their MRR when the month began and now, and whether they started or stopped a subscription.
  const customers = db()
    .$with("customers")
    .as(
      db()
        .select({
          mrrBefore: sql<number>`
            coalesce(sum(${amount}) filter (where not ${thisMonth}), 0)
          `.as("mrr_before"),
          mrrNow: sql<number>`sum(${amount})`.as("mrr_now"),
          started: sql<boolean>`bool_or(${kind} = 'new' and ${thisMonth})`.as("started"),
          churned: sql<boolean>`bool_or(${kind} = 'churn' and ${thisMonth})`.as("churned"),
        })
        .from(mrrMovements)
        .innerJoin(
          touched,
          and(eq(accountId, touched.accountId), eq(stripeCustomerId, touched.customerId)),
        )
        .groupBy(accountId, stripeCustomerId),
    );

  const [row] = await db()
    .with(touched, customers)
    .select({
      newCustomers: sql<number>`
        count(*) filter (where ${customers.started} and ${customers.mrrBefore} = 0)
      `.mapWith(Number),
      churnedCustomers: sql<number>`
        count(*) filter (where ${customers.churned} and ${customers.mrrNow} = 0)
      `.mapWith(Number),
    })
    .from(customers);
  return row ?? { newCustomers: 0, churnedCustomers: 0 };
}

export interface FeedRow {
  source: "movement" | "payment";
  id: string;
  kind: MrrMovementKind | "payment";
  amount: number;
  currency: string;
  occurredAt: Date;
  origin: "backfill" | "live" | "reconcile";
  accountId: string;
  customerName: string | null;
  country: string | null;
  planName: string | null;
}

/** The latest movements and payments, newest first. */
export async function latestActivity(accountIds: string[], limit: number): Promise<FeedRow[]> {
  const [movementRows, paymentRows] = await Promise.all([
    db()
      .select({
        id: mrrMovements.id,
        kind: mrrMovements.kind,
        amount: mrrMovements.amount,
        currency: mrrMovements.currency,
        occurredAt: mrrMovements.occurredAt,
        origin: mrrMovements.origin,
        accountId: mrrMovements.accountId,
        customerName: mrrMovements.customerName,
        country: mrrMovements.customerCountry,
        planName: mrrMovements.planName,
      })
      .from(mrrMovements)
      .where(inArray(mrrMovements.accountId, accountIds))
      .orderBy(desc(mrrMovements.occurredAt), desc(mrrMovements.id))
      .limit(limit),
    db()
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
      })
      .from(payments)
      // Fully refunded payments are not worth showing.
      .where(
        and(inArray(payments.accountId, accountIds), gt(payments.amount, payments.amountRefunded)),
      )
      .orderBy(desc(payments.occurredAt), desc(payments.id))
      .limit(limit),
  ]);

  const plans = await mainPlans(
    accountIds,
    paymentRows.flatMap((row) => (row.customerId ? [row.customerId] : [])),
  );
  const rows: FeedRow[] = [
    ...movementRows.map((row) => ({ ...row, source: "movement" as const })),
    ...paymentRows.map(({ customerId, ...row }) => ({
      ...row,
      source: "payment" as const,
      kind: "payment" as const,
      planName: (customerId && plans.get(`${row.accountId}:${customerId}`)) || null,
    })),
  ];
  return rows
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime() || b.id.localeCompare(a.id))
    .slice(0, limit);
}

/**
 * Charges don't say which plan they pay for: name each customer's main subscription (the one
 * bringing the most MRR, then the latest), keyed by `<account id>:<customer id>`.
 */
async function mainPlans(accountIds: string[], customerIds: string[]) {
  const plans = new Map<string, string>();
  if (!customerIds.length) return plans;

  const rows = await db()
    .select({
      accountId: subscriptions.accountId,
      customerId: subscriptions.stripeCustomerId,
      planName: subscriptions.planName,
    })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.accountId, accountIds),
        inArray(subscriptions.stripeCustomerId, [...new Set(customerIds)]),
        isNotNull(subscriptions.planName),
      ),
    )
    .orderBy(desc(subscriptions.mrr), desc(subscriptions.startedAt));
  for (const row of rows) {
    const key = `${row.accountId}:${row.customerId}`;
    if (row.planName && !plans.has(key)) plans.set(key, row.planName);
  }
  return plans;
}

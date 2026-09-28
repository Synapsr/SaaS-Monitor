import "server-only";
import { and, count, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments, stripeAccounts } from "@/db/schema";
import { DAY_MS } from "@/lib/durations";
import type { StripeAccountRow } from "./lease";
import type { SyncState } from "./policy";

/** Status of an account that works (again): importing until its backfill completes. */
export function workingStatus() {
  const status = sql`case when ${stripeAccounts.backfill} is null then 'ready' else 'importing' end`;
  return sql`(${status})::stripe_account_status`;
}

/** Payments of the last 30 days per account: they set Stripe's read allowance. */
export async function recentPaymentCounts(
  accountIds: readonly string[],
  now: Date,
): Promise<Map<string, number>> {
  if (!accountIds.length) return new Map();
  const rows = await db()
    .select({ accountId: payments.accountId, count: count() })
    .from(payments)
    .where(
      and(
        inArray(payments.accountId, [...accountIds]),
        gte(payments.occurredAt, new Date(now.getTime() - 30 * DAY_MS)),
      ),
    )
    .groupBy(payments.accountId);
  return new Map(rows.map((row) => [row.accountId, row.count]));
}

type SyncColumns = Pick<
  StripeAccountRow,
  | "status"
  | "lastSyncedAt"
  | "syncRequestedAt"
  | "syncLockedUntil"
  | "encryptedWebhookSecret"
  | "lastWebhookAt"
  | "lastEventAt"
>;

export function toSyncState(account: SyncColumns, paymentsLast30Days: number): SyncState {
  return {
    status: account.status,
    lastSyncedAt: account.lastSyncedAt,
    syncRequestedAt: account.syncRequestedAt,
    syncLockedUntil: account.syncLockedUntil,
    hasWebhookSecret: account.encryptedWebhookSecret !== null,
    lastWebhookAt: account.lastWebhookAt,
    lastEventAt: account.lastEventAt,
    paymentsLast30Days,
  };
}

import "server-only";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import type { MySqlUpdateSetSource } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { stripeAccounts } from "@/db/schema";

export type StripeAccountRow = typeof stripeAccounts.$inferSelect;
export type AccountUpdate = MySqlUpdateSetSource<typeof stripeAccounts>;

/** Longer than any sync: a ~20 s scan budget plus slow Stripe responses and their retries. */
const LEASE_MS = 3 * 60 * 1000;

export interface SyncLease {
  account: StripeAccountRow;
  until: Date;
}

/**
 * Claims the right to sync an account, in a single atomic update: among concurrent callers
 * (display tabs, server instances), one gets the lease and the others skip the account. A crashed
 * sync only blocks the account until its lease expires. The account is read in the same
 * transaction, while the update still locks its row.
 */
export async function acquireSyncLease(accountId: string, now: Date): Promise<SyncLease | null> {
  const until = new Date(now.getTime() + LEASE_MS);
  return db().transaction(async (tx) => {
    const [{ affectedRows }] = await tx
      .update(stripeAccounts)
      .set({ syncLockedUntil: until })
      .where(
        and(
          eq(stripeAccounts.id, accountId),
          or(isNull(stripeAccounts.syncLockedUntil), lt(stripeAccounts.syncLockedUntil, now)),
        ),
      );
    if (!affectedRows) return null;
    const [account] = await tx
      .select()
      .from(stripeAccounts)
      .where(eq(stripeAccounts.id, accountId));
    return { account, until };
  });
}

/**
 * Ends the lease with the sync's final update. `syncLockedUntil` may be set again to delay the
 * next attempt (backoff). Does nothing if the lease expired and another sync took over.
 */
export async function releaseSyncLease(lease: SyncLease, values: AccountUpdate): Promise<void> {
  await db()
    .update(stripeAccounts)
    .set({ syncLockedUntil: null, ...values })
    .where(
      and(eq(stripeAccounts.id, lease.account.id), eq(stripeAccounts.syncLockedUntil, lease.until)),
    );
}

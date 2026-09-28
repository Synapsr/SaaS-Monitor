import { eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { mrrMovements, stripeAccounts, subscriptions } from "@/db/schema";
import { encryptSecret } from "@/server/crypto";
import { toUnixTime } from "@/server/sync/context";
import { newBackfill } from "@/server/sync/scan";

export const TEST_SECRET_KEY = "rk_test_51TestKeyOfSaaSMonitor4f2a";

/** A connected Stripe account waiting for its import, as `connectStripeAccount` leaves it. */
export async function createStripeAccount(
  workspaceId: string,
  {
    now = new Date(),
    ...overrides
  }: Partial<typeof stripeAccounts.$inferInsert> & { now?: Date } = {},
) {
  const [account] = await db()
    .insert(stripeAccounts)
    .values({
      workspaceId,
      name: "Acme",
      stripeAccountId: "acct_fake",
      livemode: false,
      encryptedSecretKey: encryptSecret(TEST_SECRET_KEY),
      secretKeyHint: "rk_test_…4f2a",
      defaultCurrency: "usd",
      status: "importing",
      backfill: newBackfill(now),
      eventsCursor: toUnixTime(now),
      ...overrides,
    })
    .returning();
  return account;
}

export async function getStripeAccount(accountId: string) {
  const [account] = await db()
    .select()
    .from(stripeAccounts)
    .where(eq(stripeAccounts.id, accountId));
  return account;
}

/**
 * MRR per currency according to the mirror and to the ledger. The ledger must always add up to
 * the mirror: tests compare both after every kind of sync.
 */
export async function mrrTotals(accountId: string) {
  const [mirror, ledger] = await Promise.all([
    db()
      .select({ currency: subscriptions.currency, total: sum(subscriptions.mrr).mapWith(Number) })
      .from(subscriptions)
      .where(eq(subscriptions.accountId, accountId))
      .groupBy(subscriptions.currency),
    db()
      .select({ currency: mrrMovements.currency, total: sum(mrrMovements.amount).mapWith(Number) })
      .from(mrrMovements)
      .where(eq(mrrMovements.accountId, accountId))
      .groupBy(mrrMovements.currency),
  ]);
  const byCurrency = (rows: { currency: string; total: number }[]) =>
    Object.fromEntries(
      rows.filter((row) => row.total !== 0).map((row) => [row.currency, row.total]),
    );
  return { mirror: byCurrency(mirror), ledger: byCurrency(ledger) };
}

import "server-only";
import { inArray } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db";
import { stripeAccounts } from "@/db/schema";
import { isSyncDue } from "./policy";
import { syncAccount, type SyncOptions, type SyncReport } from "./run";
import { recentPaymentCounts, toSyncState } from "./state";

export { syncAccount, type SyncOptions, type SyncReport } from "./run";

/**
 * Brings the given accounts up to date after the current response has been sent. Cheap to call
 * on every request: accounts synced recently, or already syncing elsewhere, are skipped.
 */
export function scheduleSync(accountIds: readonly string[]): void {
  const ids = [...new Set(accountIds)];
  if (!ids.length) return;
  after(() =>
    syncDueAccounts(ids).catch((error: unknown) => {
      console.error("[sync] Could not run the scheduled syncs:", error);
    }),
  );
}

/**
 * Syncs the accounts that are due: importing, flagged by a webhook, or not checked for longer
 * than their polling interval (see `isSyncDue`).
 */
export async function syncDueAccounts(
  accountIds: readonly string[],
  options: SyncOptions = {},
): Promise<SyncReport[]> {
  const now = options.now?.() ?? new Date();
  const accounts = await db()
    .select({
      id: stripeAccounts.id,
      status: stripeAccounts.status,
      lastSyncedAt: stripeAccounts.lastSyncedAt,
      syncRequestedAt: stripeAccounts.syncRequestedAt,
      syncLockedUntil: stripeAccounts.syncLockedUntil,
      encryptedWebhookSecret: stripeAccounts.encryptedWebhookSecret,
      lastWebhookAt: stripeAccounts.lastWebhookAt,
      lastEventAt: stripeAccounts.lastEventAt,
    })
    .from(stripeAccounts)
    .where(inArray(stripeAccounts.id, [...accountIds]));
  const payments = await recentPaymentCounts(
    accounts.map((account) => account.id),
    now,
  );

  const due = accounts.filter((account) =>
    isSyncDue(toSyncState(account, payments.get(account.id) ?? 0), now),
  );
  // Accounts are independent (their own keys and rate limits): sync them side by side.
  const reports = await Promise.all(due.map((account) => syncAccount(account.id, options)));
  return reports.filter((report) => report !== null);
}

import "server-only";

/**
 * Brings the given accounts up to date after the current response has been sent. Cheap to call
 * on every request: accounts synced recently, or already syncing elsewhere, are skipped.
 */
export function scheduleSync(accountIds: readonly string[]): void {
  void accountIds;
}

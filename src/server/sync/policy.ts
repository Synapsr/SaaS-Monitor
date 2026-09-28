import "server-only";

const MINUTE = 60;
const DAY = 24 * 60 * MINUTE;

/** With a healthy webhook, polling is only a safety net. Also the slowest polling pace. */
export const SAFETY_NET_INTERVAL_SECONDS = 30 * MINUTE;
const FASTEST_POLL_INTERVAL_SECONDS = MINUTE;
const RECONCILE_INTERVAL_SECONDS = DAY;
/** Webhooks may arrive shortly after a sync has already seen their event. */
const WEBHOOK_DELIVERY_GRACE_MS = 5 * MINUTE * 1000;

/**
 * How often to ask Stripe for new events when no webhook tells us.
 *
 * Stripe lets an account make 500 read requests per transaction over a rolling 30 days, with a
 * floor of 10,000 a month, and the founder's own integration shares that allowance. Polling costs
 * one request when nothing happened, so it gets at most a quarter of the allowance: an account
 * with no sales is checked every ~17 minutes, one with 100 sales a month every ~3.5 minutes, and
 * never more than once a minute.
 */
export function pollIntervalSeconds(paymentsLast30Days: number): number {
  const monthlyReadAllowance = Math.max(10_000, 500 * paymentsLast30Days);
  const pollsPerMonth = 0.25 * monthlyReadAllowance;
  const interval = Math.ceil((30 * DAY) / pollsPerMonth);
  return Math.min(SAFETY_NET_INTERVAL_SECONDS, Math.max(FASTEST_POLL_INTERVAL_SECONDS, interval));
}

export interface UpdatesState {
  hasWebhookSecret: boolean;
  lastWebhookAt: Date | null;
  /** Creation time of the newest event the sync applied. */
  lastEventAt: Date | null;
  paymentsLast30Days: number;
}

/**
 * A webhook is trusted while it announces every event the sync finds. An event newer than the
 * last delivery means Stripe stopped reaching us (disabled endpoint, changed URL…): polling at the
 * normal pace takes over until webhooks come back.
 */
export function isWebhookHealthy(state: UpdatesState): boolean {
  if (!state.hasWebhookSecret) return false;
  if (!state.lastEventAt) return true;
  return (
    state.lastWebhookAt !== null &&
    state.lastWebhookAt.getTime() + WEBHOOK_DELIVERY_GRACE_MS >= state.lastEventAt.getTime()
  );
}

export type UpdatesMode =
  { mode: "webhook"; lastEventAt: Date | null } | { mode: "polling"; intervalSeconds: number };

export function updatesMode(state: UpdatesState): UpdatesMode {
  return isWebhookHealthy(state)
    ? { mode: "webhook", lastEventAt: state.lastWebhookAt }
    : { mode: "polling", intervalSeconds: pollIntervalSeconds(state.paymentsLast30Days) };
}

export interface SyncState extends UpdatesState {
  status: "importing" | "ready" | "error";
  lastSyncedAt: Date | null;
  syncRequestedAt: Date | null;
  /** A sync is running, or the account is backing off after a failure. */
  syncLockedUntil: Date | null;
}

export function isSyncDue(account: SyncState, now: Date): boolean {
  if (account.syncLockedUntil && account.syncLockedUntil > now) return false;
  if (account.status === "importing" || !account.lastSyncedAt) return true;
  if (account.syncRequestedAt && account.syncRequestedAt > account.lastSyncedAt) return true;

  const intervalSeconds =
    account.status === "error" || isWebhookHealthy(account)
      ? SAFETY_NET_INTERVAL_SECONDS
      : pollIntervalSeconds(account.paymentsLast30Days);
  return now.getTime() - account.lastSyncedAt.getTime() >= intervalSeconds * 1000;
}

/** A full reconcile runs daily to fix drift, such as a repeating coupon that silently ended. */
export function isReconcileDue(lastReconciledAt: Date | null, now: Date): boolean {
  return (
    !lastReconciledAt ||
    now.getTime() - lastReconciledAt.getTime() >= RECONCILE_INTERVAL_SECONDS * 1000
  );
}

/** Waits 1, 2, 4… minutes after consecutive failures, up to the safety-net interval. */
export function retryDelaySeconds(consecutiveFailures: number): number {
  const delay = MINUTE * 2 ** Math.max(0, consecutiveFailures - 1);
  return Math.min(SAFETY_NET_INTERVAL_SECONDS, delay);
}

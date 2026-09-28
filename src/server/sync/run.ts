import "server-only";
import { decryptSecret } from "@/server/crypto";
import { describeAccessError, redactSecrets, StripeAccessError } from "@/server/stripe/errors";
import {
  createStripeGateway,
  type GatewayFactory,
  type StripeGateway,
} from "@/server/stripe/gateway";
import type { SyncContext } from "./context";
import { runIncremental } from "./incremental";
import {
  acquireSyncLease,
  releaseSyncLease,
  type AccountUpdate,
  type StripeAccountRow,
} from "./lease";
import { isReconcileDue, retryDelaySeconds, SAFETY_NET_INTERVAL_SECONDS } from "./policy";
import { newScan, runScan } from "./scan";
import { workingStatus } from "./state";

export interface SyncOptions {
  /** Creates the Stripe gateway from the account's key; tests pass a fake. */
  createGateway?: GatewayFactory;
  /** Current time, for tests. */
  now?: () => Date;
  /** How long a scan may take new pages before saving its cursor. */
  scanBudgetMs?: number;
}

/** Keeps each run well within the time limits of serverless platforms. */
const SCAN_BUDGET_MS = 20_000;

export type SyncMode = "import" | "incremental" | "reconcile";

export interface SyncReport {
  accountId: string;
  mode: SyncMode;
  ok: boolean;
  /** Movements and payments written. */
  changes: number;
  /** Requests sent to Stripe, retries included. */
  requests: number;
  durationMs: number;
}

/** The stored key cannot be decrypted, typically because `ENCRYPTION_KEY` changed. */
class UnreadableKeyError extends Error {}

/**
 * Brings one account up to date: continues its import, or applies new events and runs the daily
 * reconcile. Returns `null` when another sync holds the account. Stripe errors are recorded on the
 * account (revoked key, missing permission) or retried later with backoff, never thrown.
 */
export async function syncAccount(
  accountId: string,
  options: SyncOptions = {},
): Promise<SyncReport | null> {
  const now = options.now?.() ?? new Date();
  const lease = await acquireSyncLease(accountId, now);
  if (!lease) return null;

  const startedAt = performance.now();
  const { account } = lease;
  let mode: SyncMode = account.backfill ? "import" : "incremental";
  let gateway: StripeGateway | null = null;
  let changes = 0;
  const report = (ok: boolean): SyncReport => ({
    accountId,
    mode,
    ok,
    changes,
    requests: gateway?.requestCount ?? 0,
    durationMs: Math.round(performance.now() - startedAt),
  });

  try {
    gateway = (options.createGateway ?? createStripeGateway)(readSecretKey(account));
    const context: SyncContext = {
      account,
      gateway,
      now,
      deadline: Date.now() + (options.scanBudgetMs ?? SCAN_BUDGET_MS),
    };

    if (account.backfill) {
      changes += await runScan(context, "backfill", account.backfill);
    } else {
      const incremental = await runIncremental(context);
      changes += incremental.changes;
      const reconcile =
        incremental.catchUp ??
        account.reconcile ??
        (isReconcileDue(account.lastReconciledAt, now) ? newScan(now, null) : null);
      if (reconcile) {
        mode = "reconcile";
        changes += await runScan(context, "reconcile", reconcile);
      }
    }

    await releaseSyncLease(lease, {
      lastSyncedAt: now,
      syncFailures: 0,
      lastError: null,
      status: workingStatus(),
    });
    const result = report(true);
    console.info(
      `[sync] account=${accountId} mode=${mode} changes=${result.changes} requests=${result.requests} duration=${result.durationMs}ms`,
    );
    return result;
  } catch (error) {
    const failure = describeFailure(account, error, now);
    await releaseSyncLease(lease, failure.values);
    const result = report(false);
    const line = `[sync] account=${accountId} mode=${mode} failed after ${result.durationMs}ms (requests=${result.requests}): ${failure.reason}; next attempt in ${failure.retryInSeconds}s`;
    if (failure.expected) console.warn(line);
    else console.error(line, error);
    return result;
  }
}

function readSecretKey(account: StripeAccountRow): string {
  try {
    return decryptSecret(account.encryptedSecretKey);
  } catch {
    throw new UnreadableKeyError("The stored Stripe key cannot be decrypted.");
  }
}

interface Failure {
  values: AccountUpdate;
  reason: string;
  retryInSeconds: number;
  /** Stripe or configuration trouble, as opposed to a bug worth a stack trace. */
  expected: boolean;
}

/** What the user must do when only they can fix the error (a new key, a permission). */
function actionFor(error: unknown): string | null {
  if (error instanceof UnreadableKeyError) {
    return "The saved Stripe key can no longer be decrypted (was ENCRYPTION_KEY changed?). Connect the account again.";
  }
  if (
    error instanceof StripeAccessError &&
    (error.kind === "authentication" || error.kind === "permission")
  ) {
    return describeAccessError(error);
  }
  return null;
}

/** Errors only the user can fix put the account in `error`; others are retried with backoff. */
function describeFailure(account: StripeAccountRow, error: unknown, now: Date): Failure {
  const syncFailures = account.syncFailures + 1;
  const retryAt = (seconds: number) => new Date(now.getTime() + seconds * 1000);

  const userMessage = actionFor(error);
  if (userMessage) {
    // Checked again now and then: a fixed permission brings the account back on its own.
    return {
      values: {
        status: "error",
        lastError: userMessage,
        syncFailures,
        syncLockedUntil: retryAt(SAFETY_NET_INTERVAL_SECONDS),
      },
      reason: userMessage,
      retryInSeconds: SAFETY_NET_INTERVAL_SECONDS,
      expected: true,
    };
  }

  const retryInSeconds = retryDelaySeconds(syncFailures);
  const isStripeError = error instanceof StripeAccessError;
  return {
    values: { syncFailures, syncLockedUntil: retryAt(retryInSeconds) },
    reason: isStripeError
      ? `${error.kind}: ${error.message}`
      : redactSecrets(error instanceof Error ? error.message : String(error)),
    retryInSeconds,
    expected: isStripeError && error.isTransient,
  };
}

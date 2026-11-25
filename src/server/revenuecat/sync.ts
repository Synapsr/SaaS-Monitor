import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  revenuecatDailyMetrics,
  revenuecatMetrics,
  stripeAccounts,
  type RevenueCatProductEntry,
  type ScanProgress,
} from "@/db/schema";
import { DAY_MS } from "@/lib/durations";
import { decryptSecret } from "@/server/crypto";
import {
  releaseSyncLease,
  type AccountUpdate,
  type StripeAccountRow,
  type SyncLease,
} from "@/server/sync/lease";
import { retryDelaySeconds, SAFETY_NET_INTERVAL_SECONDS } from "@/server/sync/policy";
import type { SyncMode, SyncReport } from "@/server/sync/run";
import { buildDailyMetricRows } from "./charts";
import {
  describeRevenueCatAccessError,
  redactRevenueCatSecrets,
  REVENUECAT_UNREADABLE_KEY_ERROR,
  RevenueCatAccessError,
} from "./errors";
import {
  createRevenueCatGateway,
  type RevenueCatGateway,
  type RevenueCatGatewayFactory,
} from "./gateway";

/** Historical chart lookbacks, matching SaaS Monitor's 12m chart, 2-month revenue, and today's sign-ups. */
const MRR_MOVEMENT_DAYS = 365;
const REVENUE_DAYS = 65;
const ACTIVES_NEW_DAYS = 35;
const CUSTOMERS_NEW_DAYS = 7;

export interface RevenueCatSyncOptions {
  createGateway?: RevenueCatGatewayFactory;
  now?: () => Date;
}

class UnreadableRevenueCatKeyError extends Error {}

export function newRevenueCatBackfill(now: Date): ScanProgress {
  return {
    phase: "subscriptions",
    cursor: null,
    startedAt: now.toISOString(),
    paymentsSince: null,
    customersSince: null,
    subscriptions: 0,
    payments: 0,
    customers: 0,
  };
}

function utcDayOffset(now: Date, daysAgo: number): string {
  return new Date(now.getTime() - daysAgo * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Syncs a RevenueCat project from RevenueCat REST API v2:
 * - Overview metrics (`mrr`, `active_subscriptions`, `active_trials`)
 * - Daily charts (`mrr_movement`, `revenue`, `actives_new`, `customers_new`)
 * - Product catalog (best effort, for webhook display names and durations)
 */
export async function syncRevenueCatAccount(
  lease: SyncLease,
  options: RevenueCatSyncOptions = {},
): Promise<SyncReport> {
  const startedAt = performance.now();
  const { account } = lease;
  const now = options.now?.() ?? new Date();
  const mode: SyncMode = account.backfill ? "import" : "incremental";
  let gateway: RevenueCatGateway | null = null;
  let changes = 0;

  const report = (ok: boolean): SyncReport => ({
    accountId: account.id,
    mode,
    ok,
    changes,
    requests: gateway?.requestCount ?? 0,
    durationMs: Math.round(performance.now() - startedAt),
  });

  try {
    const projectId = account.stripeAccountId;
    if (!projectId) {
      throw new RevenueCatAccessError("invalid_request", "Missing RevenueCat project identifier.");
    }
    gateway = (options.createGateway ?? createRevenueCatGateway)(readSecretKey(account));

    const currency = (account.defaultCurrency ?? "usd").toUpperCase();
    const today = utcDayOffset(now, 0);

    const overview = await gateway.getOverviewMetrics(projectId, currency);
    const chartCurrency = overview.currency.toUpperCase();

    const [mrrMovement, revenue, activesNew, customersNew, products] = await Promise.all([
      gateway.getChartData(projectId, "mrr_movement", {
        startDate: utcDayOffset(now, MRR_MOVEMENT_DAYS),
        endDate: today,
        resolution: "0",
        currency: chartCurrency,
      }),
      gateway.getChartData(projectId, "revenue", {
        startDate: utcDayOffset(now, REVENUE_DAYS),
        endDate: today,
        resolution: "0",
        currency: chartCurrency,
      }),
      optionalChart(() =>
        gateway!.getChartData(projectId, "actives_new", {
          startDate: utcDayOffset(now, ACTIVES_NEW_DAYS),
          endDate: today,
          resolution: "0",
        }),
      ),
      optionalChart(() =>
        gateway!.getChartData(projectId, "customers_new", {
          startDate: utcDayOffset(now, CUSTOMERS_NEW_DAYS),
          endDate: today,
          resolution: "0",
        }),
      ),
      optionalProducts(() => gateway!.listProducts(projectId)),
    ]);

    const dailyRows = buildDailyMetricRows({
      currency: overview.currency,
      mrrMovement,
      revenue,
      activesNew,
      customersNew,
    });
    const productMap: Record<string, RevenueCatProductEntry> = {};
    for (const product of products) {
      const displayName = product.displayName || product.storeIdentifier;
      const entry = { displayName, duration: product.duration };
      productMap[product.storeIdentifier] = entry;
      productMap[product.id] = entry;
    }

    await db().transaction(async (tx) => {
      await tx
        .insert(revenuecatMetrics)
        .values({
          accountId: account.id,
          currency: overview.currency,
          mrr: overview.mrr,
          activeSubscriptions: overview.activeSubscriptions,
          activeTrials: overview.activeTrials,
          overviewUpdatedAt: overview.updatedAt,
          products: productMap,
        })
        .onDuplicateKeyUpdate({
          set: {
            currency: overview.currency,
            mrr: overview.mrr,
            activeSubscriptions: overview.activeSubscriptions,
            activeTrials: overview.activeTrials,
            overviewUpdatedAt: overview.updatedAt,
            ...(products.length > 0 ? { products: productMap } : {}),
          },
        });

      const chunkSize = 100;
      for (let i = 0; i < dailyRows.length; i += chunkSize) {
        const chunk = dailyRows.slice(i, i + chunkSize).map((row) => ({
          accountId: account.id,
          ...row,
        }));
        await tx
          .insert(revenuecatDailyMetrics)
          .values(chunk)
          .onDuplicateKeyUpdate({
            set: {
              currency: sql`values(${revenuecatDailyMetrics.currency})`,
              revenue: sql`values(${revenuecatDailyMetrics.revenue})`,
              mrrNew: sql`values(${revenuecatDailyMetrics.mrrNew})`,
              mrrExpansion: sql`values(${revenuecatDailyMetrics.mrrExpansion})`,
              mrrReactivation: sql`values(${revenuecatDailyMetrics.mrrReactivation})`,
              mrrContraction: sql`values(${revenuecatDailyMetrics.mrrContraction})`,
              mrrChurn: sql`values(${revenuecatDailyMetrics.mrrChurn})`,
              newPayingCustomers: sql`values(${revenuecatDailyMetrics.newPayingCustomers})`,
              newCustomers: sql`values(${revenuecatDailyMetrics.newCustomers})`,
            },
          });
      }

      await tx
        .update(stripeAccounts)
        .set({
          defaultCurrency: overview.currency,
          backfill: null,
          reconcile: null,
          status: "ready",
          lastError: null,
          lastReconciledAt: now,
        })
        .where(eq(stripeAccounts.id, account.id));
    });

    changes = dailyRows.length;

    await releaseSyncLease(lease, {
      lastSyncedAt: now,
      syncFailures: 0,
      lastError: null,
      status: "ready",
    });

    const result = report(true);
    console.info(
      `[sync:revenuecat] account=${account.id} mode=${mode} days=${result.changes} requests=${result.requests} duration=${result.durationMs}ms`,
    );
    return result;
  } catch (error) {
    const failure = describeFailure(account, error, now);
    await releaseSyncLease(lease, failure.values);
    const result = report(false);
    const line = `[sync:revenuecat] account=${account.id} mode=${mode} failed after ${result.durationMs}ms (requests=${result.requests}): ${failure.reason}; next attempt in ${failure.retryInSeconds}s`;
    if (failure.expected) console.warn(line);
    else console.error(line, error);
    return result;
  }
}

async function optionalChart<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (
      error instanceof RevenueCatAccessError &&
      (error.kind === "authentication" || error.kind === "permission")
    ) {
      throw error;
    }
    return null;
  }
}

async function optionalProducts<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    // `project_configuration:products:read` is optional; skip silently if absent.
    if (error instanceof RevenueCatAccessError && error.kind === "permission") return [];
    if (error instanceof RevenueCatAccessError && error.kind === "authentication") throw error;
    return [];
  }
}

function readSecretKey(account: StripeAccountRow): string {
  try {
    return decryptSecret(account.encryptedSecretKey);
  } catch {
    throw new UnreadableRevenueCatKeyError("The stored RevenueCat key cannot be decrypted.");
  }
}

function actionFor(error: unknown): string | null {
  if (error instanceof UnreadableRevenueCatKeyError) return REVENUECAT_UNREADABLE_KEY_ERROR;
  if (
    error instanceof RevenueCatAccessError &&
    (error.kind === "authentication" || error.kind === "permission")
  ) {
    return describeRevenueCatAccessError(error);
  }
  return null;
}

function describeFailure(
  account: StripeAccountRow,
  error: unknown,
  now: Date,
): {
  values: AccountUpdate;
  reason: string;
  retryInSeconds: number;
  expected: boolean;
} {
  const syncFailures = account.syncFailures + 1;
  const retryAt = (seconds: number) => new Date(now.getTime() + seconds * 1000);

  const userMessage = actionFor(error);
  if (userMessage) {
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

  const isRcError = error instanceof RevenueCatAccessError;
  const retryInSeconds = Math.max(
    retryDelaySeconds(syncFailures),
    isRcError && error.retryAfterSeconds ? error.retryAfterSeconds : 0,
  );
  return {
    values: { syncFailures, syncLockedUntil: retryAt(retryInSeconds) },
    reason: isRcError
      ? `${error.kind}: ${error.message}`
      : redactRevenueCatSecrets(error instanceof Error ? error.message : String(error)),
    retryInSeconds,
    expected: isRcError && error.isTransient,
  };
}

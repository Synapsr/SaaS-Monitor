import "server-only";
import { and, asc, eq, inArray, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { mrrMovements, payments, stripeAccounts, subscriptions } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { nameSchema } from "@/lib/names";
import type { StripePermissionId } from "@/lib/stripe-permissions";
import { decryptSecret, encryptSecret } from "@/server/crypto";
import { createCurrencyConverter } from "@/server/fx";
import { toUnixTime } from "@/server/sync/context";
import { scheduleSync } from "@/server/sync";
import { updatesMode } from "@/server/sync/policy";
import { newBackfill } from "@/server/sync/scan";
import { recentPaymentCounts, toSyncState, workingStatus } from "@/server/sync/state";
import {
  ACCOUNT_NOT_FOUND,
  describeAccessError,
  StripeAccessError,
  UNREADABLE_KEY_ERROR,
} from "./errors";
import {
  createStripeGateway,
  type ProbedResource,
  type StripeAccessOptions,
  type StripeGateway,
} from "./gateway";
import { secretKeySchema } from "./keys";
import type { AccountInfo } from "./types";
import { registerWebhookEndpoint } from "./webhooks";

/** Why a key was refused, when it lacks permissions: their ids, e.g. `rak_charge_read`. */
export interface MissingPermissions {
  missingPermissions?: string[];
}

/*
 * The actions validate input with the schemas below: the functions of this module trust it.
 */

export const accountNameSchema = nameSchema("Name the account, for example after your product.");

export const connectAccountSchema = z.object({
  name: accountNameSchema,
  secretKey: secretKeySchema,
});

/** What the dashboard shows about a connected Stripe account. */
export interface StripeAccountSummary {
  id: string;
  name: string;
  livemode: boolean;
  /** Masked key, e.g. `rk_live_…4f2a`. */
  keyHint: string;
  status: "importing" | "ready" | "error";
  /** User-facing explanation when `status` is `error`. */
  lastError: string | null;
  lastSyncedAt: Date | null;
  /** How new Stripe activity reaches the app. */
  updates:
    { mode: "webhook"; lastEventAt: Date | null } | { mode: "polling"; intervalSeconds: number };
  /** Objects imported so far, while `status` is `importing`. */
  importProgress: { subscriptions: number; payments: number } | null;
  /** Current MRR in the account's main currency, once imported. */
  mrr: { amount: number; currency: string } | null;
}

/** Read permissions every metric depends on, checked with one cheap request each. */
const REQUIRED_READS: readonly { resource: ProbedResource; permission: StripePermissionId }[] = [
  { resource: "subscriptions", permission: "rak_subscription_read" },
  { resource: "customers", permission: "rak_customer_read" },
  { resource: "charges", permission: "rak_charge_read" },
  { resource: "events", permission: "rak_event_read" },
  { resource: "products", permission: "rak_product_read" },
  { resource: "prices", permission: "rak_plan_read" },
  { resource: "coupons", permission: "rak_coupon_read" },
];

/**
 * Checks `secretKey` against Stripe, stores it encrypted in `workspaceId`, tries to register a
 * webhook for instant updates and starts the first import. Returns a user-facing error when the
 * key is invalid or lacks read permissions.
 */
export async function connectStripeAccount(
  input: { workspaceId: string } & z.infer<typeof connectAccountSchema>,
  options: StripeAccessOptions = {},
): Promise<ActionResult<{ accountId: string }, MissingPermissions>> {
  const key = input.secretKey;
  const gateway = (options.createGateway ?? createStripeGateway)(key.key);
  const access = await checkReadAccess(gateway);
  if (!access.ok) return access;

  const info = await readAccountInfo(gateway);
  if (info) {
    const [existing] = await db()
      .select({ id: stripeAccounts.id, status: stripeAccounts.status })
      .from(stripeAccounts)
      .where(
        and(
          eq(stripeAccounts.workspaceId, input.workspaceId),
          eq(stripeAccounts.stripeAccountId, info.id),
          eq(stripeAccounts.livemode, key.livemode),
        ),
      );
    if (existing?.status === "error") {
      // Connecting a failing account again replaces its key and keeps its data.
      await db()
        .update(stripeAccounts)
        .set({
          encryptedSecretKey: encryptSecret(key.key),
          secretKeyHint: key.hint,
          status: workingStatus(),
          lastError: null,
          syncFailures: 0,
          syncLockedUntil: null,
        })
        .where(eq(stripeAccounts.id, existing.id));
      scheduleSync([existing.id]);
      return { ok: true, accountId: existing.id };
    }
    if (existing) return { ok: false, error: "This Stripe account is already connected." };
  }

  const now = new Date();
  const [account] = await db()
    .insert(stripeAccounts)
    .values({
      workspaceId: input.workspaceId,
      name: input.name,
      stripeAccountId: info?.id ?? null,
      livemode: key.livemode,
      encryptedSecretKey: encryptSecret(key.key),
      secretKeyHint: key.hint,
      defaultCurrency: info?.defaultCurrency ?? null,
      status: "importing",
      backfill: newBackfill(now),
      // Events from now on are replayed after the import: nothing falls between the two.
      eventsCursor: toUnixTime(now),
    })
    .onConflictDoNothing()
    .returning({ id: stripeAccounts.id });
  // Another request connected the same account in the meantime.
  if (!account) return { ok: false, error: "This Stripe account is already connected." };

  await registerWebhookEndpoint(account.id, gateway);
  scheduleSync([account.id]);
  return { ok: true, accountId: account.id };
}

const STRIPE_UNREACHABLE = "Stripe could not be reached. Try again in a moment.";

/** The reads Stripe refused to the key, among those every metric depends on. */
async function probeReadAccess(
  gateway: StripeGateway,
): Promise<{ error: StripeAccessError; permission: StripePermissionId }[]> {
  const results = await Promise.allSettled(
    REQUIRED_READS.map(({ resource }) => gateway.probe(resource)),
  );
  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") return [];
    if (!(result.reason instanceof StripeAccessError)) throw result.reason;
    return [{ error: result.reason, permission: REQUIRED_READS[index].permission }];
  });
}

async function checkReadAccess(
  gateway: StripeGateway,
): Promise<ActionResult<object, MissingPermissions>> {
  const failures = await probeReadAccess(gateway);
  if (!failures.length) return { ok: true };

  if (failures.some(({ error }) => error.kind === "authentication")) {
    return {
      ok: false,
      error: "This key is not valid. Copy it again from the API keys page of the Stripe Dashboard.",
    };
  }
  const missing = failures.filter(({ error }) => error.kind === "permission");
  if (!missing.length) return { ok: false, error: STRIPE_UNREACHABLE };
  // Stripe names the permission it wanted; the probe's is the fallback.
  const missingPermissions = missing.map(({ error, permission }) => error.permission ?? permission);
  return {
    ok: false,
    error:
      missingPermissions.length === 1
        ? "This key is missing a permission."
        : `This key is missing ${missingPermissions.length} permissions.`,
    missingPermissions,
  };
}

/**
 * The account's id and name, best effort: the permission this needs is not documented. A refusal
 * still names the account in its message, which is enough to detect duplicates.
 */
async function readAccountInfo(gateway: StripeGateway): Promise<AccountInfo | null> {
  try {
    return await gateway.retrieveAccount();
  } catch (error) {
    if (!(error instanceof StripeAccessError)) throw error;
    return error.stripeAccountId
      ? { id: error.stripeAccountId, name: null, defaultCurrency: null }
      : null;
  }
}

export async function listStripeAccountSummaries(
  workspaceId: string,
): Promise<StripeAccountSummary[]> {
  const now = new Date();
  const accounts = await db()
    .select()
    .from(stripeAccounts)
    .where(eq(stripeAccounts.workspaceId, workspaceId))
    .orderBy(asc(stripeAccounts.createdAt));
  if (!accounts.length) return [];

  const ids = accounts.map((account) => account.id);
  const [mrrRows, paymentCounts] = await Promise.all([
    db()
      .select({
        accountId: subscriptions.accountId,
        currency: subscriptions.currency,
        mrr: sum(subscriptions.mrr).mapWith(Number),
      })
      .from(subscriptions)
      .where(inArray(subscriptions.accountId, ids))
      .groupBy(subscriptions.accountId, subscriptions.currency),
    recentPaymentCounts(ids, now),
  ]);

  return Promise.all(
    accounts.map(async (account) => ({
      id: account.id,
      name: account.name,
      livemode: account.livemode,
      keyHint: account.secretKeyHint,
      status: account.status,
      lastError: account.status === "error" ? account.lastError : null,
      lastSyncedAt: account.lastSyncedAt,
      updates: updatesMode(toSyncState(account, paymentCounts.get(account.id) ?? 0)),
      importProgress: account.backfill
        ? { subscriptions: account.backfill.subscriptions, payments: account.backfill.payments }
        : null,
      mrr: account.backfill
        ? null
        : await accountMrr(
            account.defaultCurrency,
            mrrRows.filter((row) => row.accountId === account.id),
          ),
    })),
  );
}

/** Totals an account's MRR in its main currency: its default one, or the one bringing the most. */
async function accountMrr(
  defaultCurrency: string | null,
  rows: readonly { currency: string; mrr: number }[],
): Promise<{ amount: number; currency: string }> {
  const byAmount = [...rows].sort((a, b) => b.mrr - a.mrr);
  const currency = defaultCurrency ?? byAmount[0]?.currency ?? "usd";
  const converter = await createCurrencyConverter(
    currency,
    rows.filter((row) => row.mrr > 0).map((row) => row.currency),
  );
  const amount = rows.reduce(
    (total, row) => total + (converter.convert(row.mrr, row.currency) ?? 0),
    0,
  );
  return { amount, currency };
}

export async function renameStripeAccount(
  workspaceId: string,
  accountId: string,
  name: string,
): Promise<ActionResult> {
  const renamed = await db()
    .update(stripeAccounts)
    .set({ name })
    .where(and(eq(stripeAccounts.workspaceId, workspaceId), eq(stripeAccounts.id, accountId)))
    .returning({ id: stripeAccounts.id });
  return renamed.length ? { ok: true } : ACCOUNT_NOT_FOUND;
}

/** Deletes the account, its imported data and the webhook endpoint the app created. */
export async function disconnectStripeAccount(
  workspaceId: string,
  accountId: string,
  options: StripeAccessOptions = {},
): Promise<ActionResult> {
  const [account] = await db()
    .select({
      encryptedSecretKey: stripeAccounts.encryptedSecretKey,
      webhookEndpointId: stripeAccounts.webhookEndpointId,
    })
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.workspaceId, workspaceId), eq(stripeAccounts.id, accountId)));
  if (!account) return ACCOUNT_NOT_FOUND;

  if (account.webhookEndpointId) {
    try {
      const gateway = (options.createGateway ?? createStripeGateway)(
        decryptSecret(account.encryptedSecretKey),
      );
      await gateway.deleteWebhookEndpoint(account.webhookEndpointId);
    } catch (error) {
      // A revoked key cannot remove the endpoint; Stripe disables it once deliveries keep failing.
      console.warn(
        `[stripe] Could not delete webhook endpoint of account ${accountId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  // Subscriptions, movements, payments and screen links go with it (cascade).
  await db()
    .delete(stripeAccounts)
    .where(and(eq(stripeAccounts.workspaceId, workspaceId), eq(stripeAccounts.id, accountId)));
  return { ok: true };
}

/**
 * Drops the imported data and imports the account again from scratch. Only with a key that can
 * still read Stripe: the data would be gone for nothing otherwise, and the upgrades and downgrades
 * recorded as they happened can never be imported again.
 */
export async function reimportStripeAccount(
  workspaceId: string,
  accountId: string,
  options: StripeAccessOptions = {},
): Promise<ActionResult> {
  const [account] = await db()
    .select({ encryptedSecretKey: stripeAccounts.encryptedSecretKey })
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.workspaceId, workspaceId), eq(stripeAccounts.id, accountId)));
  if (!account) return ACCOUNT_NOT_FOUND;
  const access = await checkStoredKey(account.encryptedSecretKey, options);
  if (!access.ok) return access;

  const now = new Date();
  const reset = await db().transaction(async (tx) => {
    const [account] = await tx
      .update(stripeAccounts)
      .set({
        status: "importing",
        lastError: null,
        backfill: newBackfill(now),
        reconcile: null,
        eventsCursor: toUnixTime(now),
        recentEventIds: [],
        lastEventAt: null,
        lastSyncedAt: null,
        lastReconciledAt: null,
        syncFailures: 0,
        // Any sync still running for the old data loses its lease.
        syncLockedUntil: null,
      })
      .where(and(eq(stripeAccounts.workspaceId, workspaceId), eq(stripeAccounts.id, accountId)))
      .returning({ id: stripeAccounts.id });
    if (!account) return false;
    await tx.delete(mrrMovements).where(eq(mrrMovements.accountId, accountId));
    await tx.delete(subscriptions).where(eq(subscriptions.accountId, accountId));
    await tx.delete(payments).where(eq(payments.accountId, accountId));
    return true;
  });
  if (!reset) return ACCOUNT_NOT_FOUND;
  scheduleSync([accountId]);
  return { ok: true };
}

/** Whether the stored key can still read everything an import needs. */
async function checkStoredKey(
  encryptedSecretKey: string,
  options: StripeAccessOptions,
): Promise<ActionResult> {
  let key: string;
  try {
    key = decryptSecret(encryptedSecretKey);
  } catch {
    return { ok: false, error: UNREADABLE_KEY_ERROR };
  }
  const failures = await probeReadAccess((options.createGateway ?? createStripeGateway)(key));
  const refusal =
    failures.find(({ error }) => error.kind === "authentication") ??
    failures.find(({ error }) => error.kind === "permission");
  if (refusal) return { ok: false, error: describeAccessError(refusal.error) };
  return failures.length ? { ok: false, error: STRIPE_UNREACHABLE } : { ok: true };
}

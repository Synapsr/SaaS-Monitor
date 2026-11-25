import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  mrrMovements,
  payments,
  revenuecatMetrics,
  stripeAccounts,
  subscriptions,
  type RevenueCatProductEntry,
} from "@/db/schema";
import { env } from "@/env";
import type { ActionResult } from "@/lib/action-result";
import type { ChurnReason, MrrMovementKind } from "@/lib/display/types";
import { toMinorUnits } from "@/lib/money";
import { revenueCatPermissionLabel } from "@/lib/revenuecat-permissions";
import { siteConfig } from "@/lib/site";
import { decryptSecret, encryptSecret } from "@/server/crypto";
import { ACCOUNT_NOT_FOUND } from "@/server/stripe/errors";
import { isPublicHttpsUrl } from "@/server/stripe/webhooks";
import { billingIntervalOf, normalizeMonthlyMrr } from "./charts";
import { RevenueCatAccessError } from "./errors";
import {
  createRevenueCatGateway,
  type RevenueCatAccessOptions,
  type RevenueCatGateway,
} from "./gateway";

/** Event types requested when creating a RevenueCat webhook integration via API v2. */
export const REVENUECAT_WEBHOOK_EVENT_TYPES = [
  "initial_purchase",
  "renewal",
  "cancellation",
  "uncancellation",
  "non_renewing_purchase",
  "subscription_paused",
  "expiration",
  "billing_issue",
  "product_change",
  "subscription_extended",
  "refund_reversed",
] as const;

const MAX_RECENT_EVENT_IDS = 200;
const SIGNATURE_TOLERANCE_SECONDS = 300;

function webhookEndpointUrl(accountId: string): string {
  return `${env().APP_URL}/api/webhooks/revenuecat/${accountId}`;
}

const INVALID_WEBHOOK_SECRET =
  "Paste the Authorization header value or HMAC signing secret configured in RevenueCat (at least 8 characters).";

export const revenueCatWebhookSecretSchema = z
  .string()
  .trim()
  .min(8, INVALID_WEBHOOK_SECRET)
  .max(500, INVALID_WEBHOOK_SECRET);

export interface StoredRevenueCatWebhookSecret {
  authHeader?: string | null;
  signingSecret?: string | null;
}

function parseStoredSecret(raw: string): StoredRevenueCatWebhookSecret {
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as StoredRevenueCatWebhookSecret;
      if (parsed && typeof parsed === "object") {
        return {
          authHeader: typeof parsed.authHeader === "string" ? parsed.authHeader : null,
          signingSecret: typeof parsed.signingSecret === "string" ? parsed.signingSecret : null,
        };
      }
    } catch {
      // Fall through to raw secret.
    }
  }
  return { authHeader: raw, signingSecret: raw };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies an incoming RevenueCat webhook using either:
 * 1. `X-RevenueCat-Webhook-Signature: t=<unix_sec>,v1=<hmac_sha256_hex>` (HMAC signing)
 * 2. `Authorization` header (shared token, matching raw or `Bearer <token>`)
 */
export function verifyRevenueCatWebhook(
  payload: string,
  headers: { signature: string | null; authorization: string | null },
  storedSecretRaw: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  const stored = parseStoredSecret(storedSecretRaw);

  if (headers.signature && stored.signingSecret) {
    if (verifyHmacSignature(payload, headers.signature, stored.signingSecret, nowSeconds)) {
      return true;
    }
  }

  if (headers.authorization && stored.authHeader) {
    const incoming = headers.authorization.trim();
    const expected = stored.authHeader.trim();
    if (safeEqual(incoming, expected)) return true;
    if (
      !expected.toLowerCase().startsWith("bearer ") &&
      safeEqual(incoming, `Bearer ${expected}`)
    ) {
      return true;
    }
    if (expected.toLowerCase().startsWith("bearer ") && safeEqual(incoming, expected.slice(7))) {
      return true;
    }
  }

  return false;
}

function verifyHmacSignature(
  payload: string,
  header: string,
  secret: string,
  nowSeconds: number,
): boolean {
  const parts = new Map<string, string>();
  for (const segment of header.split(",")) {
    const index = segment.indexOf("=");
    if (index === -1) continue;
    parts.set(segment.slice(0, index).trim(), segment.slice(index + 1).trim());
  }
  const timestamp = parts.get("t");
  const expectedSig = parts.get("v1");
  if (!timestamp || !expectedSig) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const computed = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return safeEqual(computed, expectedSig);
}

export type RevenueCatWebhookRegistration =
  { ok: true } | { ok: false; reason: "private_url" | "refused" | "unavailable" };

/**
 * Registers a webhook integration on RevenueCat via API v2. Needs a public HTTPS `APP_URL` and
 * the optional `project_configuration:integrations:read_write` permission.
 */
export async function registerRevenueCatWebhook(
  accountId: string,
  projectId: string,
  gateway: RevenueCatGateway,
  livemode: boolean = true,
): Promise<RevenueCatWebhookRegistration> {
  const url = webhookEndpointUrl(accountId);
  if (!isPublicHttpsUrl(url)) return { ok: false, reason: "private_url" };

  const authHeader = `Bearer rcwh_${randomBytes(24).toString("base64url")}`;
  let integration: { id: string; signingSecret: string | null };
  try {
    integration = await gateway.createWebhookIntegration(projectId, {
      name: `${siteConfig.name} instant updates`,
      url,
      authorizationHeader: authHeader,
      environment: livemode ? "production" : "sandbox",
      eventTypes: REVENUECAT_WEBHOOK_EVENT_TYPES,
    });
  } catch (error) {
    if (!(error instanceof RevenueCatAccessError)) throw error;
    return { ok: false, reason: error.isTransient ? "unavailable" : "refused" };
  }

  const secretPayload: StoredRevenueCatWebhookSecret = {
    authHeader,
    signingSecret: integration.signingSecret,
  };
  await db()
    .update(stripeAccounts)
    .set({
      webhookEndpointId: integration.id,
      encryptedWebhookSecret: encryptSecret(JSON.stringify(secretPayload)),
    })
    .where(eq(stripeAccounts.id, accountId));
  return { ok: true };
}

export async function enableRevenueCatInstantUpdates(
  workspaceId: string,
  accountId: string,
  options: RevenueCatAccessOptions = {},
): Promise<ActionResult> {
  const [account] = await db()
    .select({
      encryptedSecretKey: stripeAccounts.encryptedSecretKey,
      stripeAccountId: stripeAccounts.stripeAccountId,
      webhookEndpointId: stripeAccounts.webhookEndpointId,
      livemode: stripeAccounts.livemode,
    })
    .from(stripeAccounts)
    .where(
      and(
        eq(stripeAccounts.workspaceId, workspaceId),
        eq(stripeAccounts.id, accountId),
        eq(stripeAccounts.provider, "revenuecat"),
      ),
    );
  if (!account || !account.stripeAccountId) return ACCOUNT_NOT_FOUND;
  if (account.webhookEndpointId) return { ok: true };

  const gateway = (options.createGateway ?? createRevenueCatGateway)(
    decryptSecret(account.encryptedSecretKey),
  );
  const registration = await registerRevenueCatWebhook(
    accountId,
    account.stripeAccountId,
    gateway,
    account.livemode,
  );
  if (registration.ok) return { ok: true };
  const errors = {
    private_url:
      "RevenueCat can only send updates to a public HTTPS address. Set APP_URL to the public URL of this app.",
    refused: `RevenueCat refused to create the webhook. Give the key the “${revenueCatPermissionLabel("project_configuration:integrations:read_write")}” permission, or add the webhook manually.`,
    unavailable: "RevenueCat could not be reached. Try again in a moment.",
  };
  return { ok: false, error: errors[registration.reason] };
}

export async function setRevenueCatWebhookSecret(
  workspaceId: string,
  accountId: string,
  secret: string,
): Promise<ActionResult> {
  const [{ affectedRows }] = await db()
    .update(stripeAccounts)
    .set({ encryptedWebhookSecret: encryptSecret(secret.trim()) })
    .where(
      and(
        eq(stripeAccounts.workspaceId, workspaceId),
        eq(stripeAccounts.id, accountId),
        eq(stripeAccounts.provider, "revenuecat"),
      ),
    );
  return affectedRows ? { ok: true } : ACCOUNT_NOT_FOUND;
}

export function revenueCatWebhookSetupInstructions(accountId: string): {
  url: string;
  events: string[];
} {
  return {
    url: webhookEndpointUrl(accountId),
    events: REVENUECAT_WEBHOOK_EVENT_TYPES.map((type) => type.toUpperCase()),
  };
}

const subscriberAttributeSchema = z.object({
  value: z.string().nullable().optional(),
});

const webhookEventSchema = z.object({
  id: z.string().min(1).max(255),
  type: z.string().min(1),
  environment: z.string().nullable().optional(),
  event_timestamp_ms: z.number().nullable().optional(),
  purchased_at_ms: z.number().nullable().optional(),
  expiration_at_ms: z.number().nullable().optional(),
  app_user_id: z.string().nullable().optional(),
  original_app_user_id: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  new_product_id: z.string().nullable().optional(),
  period_type: z.string().nullable().optional(),
  transaction_id: z.string().nullable().optional(),
  original_transaction_id: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  price_in_purchased_currency: z.number().nullable().optional(),
  country_code: z.string().nullable().optional(),
  store: z.string().nullable().optional(),
  cancel_reason: z.string().nullable().optional(),
  expiration_reason: z.string().nullable().optional(),
  is_trial_conversion: z.boolean().nullable().optional(),
  subscriber_attributes: z.record(z.string(), subscriberAttributeSchema).nullable().optional(),
});

const webhookPayloadSchema = z.object({
  api_version: z.string().optional(),
  event: webhookEventSchema,
});

export type RevenueCatWebhookEvent = z.infer<typeof webhookEventSchema>;

export type RevenueCatWebhookOutcome =
  | { status: "unknown_account" }
  | { status: "invalid_signature" }
  | { status: "invalid_payload" }
  | { status: "accepted"; notify: boolean; sync: boolean };

/**
 * Verifies and ingests a RevenueCat webhook event. Live purchases, renewals and churns are written
 * immediately so wall screens and phones celebrate within seconds, while the periodic sync keeps
 * aggregate overview & chart metrics aligned with RevenueCat.
 */
export async function receiveRevenueCatWebhook(
  accountId: string,
  payload: string,
  headers: { signature: string | null; authorization: string | null },
  options: { now?: Date } = {},
): Promise<RevenueCatWebhookOutcome> {
  const now = options.now ?? new Date();
  const [account] = await db()
    .select({
      id: stripeAccounts.id,
      livemode: stripeAccounts.livemode,
      encryptedWebhookSecret: stripeAccounts.encryptedWebhookSecret,
    })
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.id, accountId), eq(stripeAccounts.provider, "revenuecat")));
  if (!account) return { status: "unknown_account" };
  if (!account.encryptedWebhookSecret) return { status: "invalid_signature" };

  let storedSecret: string;
  try {
    storedSecret = decryptSecret(account.encryptedWebhookSecret);
  } catch {
    return { status: "invalid_signature" };
  }
  if (!verifyRevenueCatWebhook(payload, headers, storedSecret, Math.floor(now.getTime() / 1000))) {
    return { status: "invalid_signature" };
  }

  let parsed: z.infer<typeof webhookPayloadSchema>;
  try {
    parsed = webhookPayloadSchema.parse(JSON.parse(payload));
  } catch {
    return { status: "invalid_payload" };
  }
  const { event } = parsed;

  // Dashboard "Send test event": acknowledge and record webhook health without creating fake sales.
  if (event.type === "TEST") {
    await db()
      .update(stripeAccounts)
      .set({ lastWebhookAt: now })
      .where(eq(stripeAccounts.id, accountId));
    return { status: "accepted", notify: false, sync: false };
  }

  // Filter out sandbox events on production accounts (and vice versa).
  const expectedEnv = account.livemode ? "PRODUCTION" : "SANDBOX";
  if (event.environment && event.environment.toUpperCase() !== expectedEnv) {
    await db()
      .update(stripeAccounts)
      .set({ lastWebhookAt: now })
      .where(eq(stripeAccounts.id, accountId));
    return { status: "accepted", notify: false, sync: false };
  }

  const [metricsRow] = await db()
    .select({ products: revenuecatMetrics.products })
    .from(revenuecatMetrics)
    .where(eq(revenuecatMetrics.accountId, accountId));
  const products = metricsRow?.products ?? {};

  const written = await db().transaction(async (tx) => {
    const [locked] = await tx
      .select({ recentEventIds: stripeAccounts.recentEventIds })
      .from(stripeAccounts)
      .where(eq(stripeAccounts.id, accountId))
      .for("update");
    if (!locked) return false;

    if (locked.recentEventIds.includes(event.id)) {
      await tx
        .update(stripeAccounts)
        .set({ lastWebhookAt: now })
        .where(eq(stripeAccounts.id, accountId));
      return false;
    }

    const occurredAt = new Date(event.event_timestamp_ms ?? event.purchased_at_ms ?? now.getTime());
    const recentEventIds = [...locked.recentEventIds, event.id].slice(-MAX_RECENT_EVENT_IDS);

    const didWrite = await applyRevenueCatEvent(tx, accountId, event, products, occurredAt, now);

    await tx
      .update(stripeAccounts)
      .set({
        recentEventIds,
        lastWebhookAt: now,
        lastEventAt: occurredAt,
        syncRequestedAt: now,
      })
      .where(eq(stripeAccounts.id, accountId));

    return didWrite;
  });

  return { status: "accepted", notify: written, sync: true };
}

function resolveProduct(
  productId: string | null | undefined,
  products: Record<string, RevenueCatProductEntry>,
): { planName: string | null; duration: string | null } {
  if (!productId) return { planName: null, duration: null };
  const exact = products[productId];
  if (exact) return { planName: exact.displayName, duration: exact.duration };
  // Google Play product ids may have `<sub_id>:<base_plan_id>` format.
  const baseId = productId.split(":")[0];
  const base = products[baseId];
  if (base) return { planName: base.displayName, duration: base.duration };
  return { planName: formatProductId(productId), duration: null };
}

/** Turns a raw store product id like `com.app.pro_monthly:p1m` into a readable fallback label. */
export function formatProductId(productId: string): string {
  const withoutPlan = productId.split(":")[0];
  const tail = withoutPlan.split(".").at(-1) ?? withoutPlan;
  return tail
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function eventMoney(event: RevenueCatWebhookEvent): { amountMinor: number; currency: string } {
  if (
    event.currency &&
    typeof event.price_in_purchased_currency === "number" &&
    Number.isFinite(event.price_in_purchased_currency)
  ) {
    const currency = event.currency.toLowerCase();
    return { amountMinor: toMinorUnits(event.price_in_purchased_currency, currency), currency };
  }
  if (typeof event.price === "number" && Number.isFinite(event.price)) {
    return { amountMinor: toMinorUnits(event.price, "usd"), currency: "usd" };
  }
  return { amountMinor: 0, currency: (event.currency ?? "USD").toLowerCase() };
}

function eventCustomerInfo(event: RevenueCatWebhookEvent) {
  const attrs = event.subscriber_attributes ?? {};
  const customerId = event.original_app_user_id ?? event.app_user_id ?? `rc:${event.id}`;
  const name = attrs["$displayName"]?.value?.trim() || null;
  const email = attrs["$email"]?.value?.trim() || null;
  const country = event.country_code?.trim().toUpperCase() || null;
  return { customerId, name, email, country };
}

function mapCancelReason(reason: string | null | undefined, scheduled: boolean): ChurnReason {
  switch (reason?.toUpperCase()) {
    case "BILLING_ERROR":
      return "unpaid";
    case "SUBSCRIPTION_PAUSED":
      return "paused";
    case "CUSTOMER_SUPPORT":
      return "canceled";
    default:
      return scheduled ? "scheduled" : "canceled";
  }
}

async function applyRevenueCatEvent(
  tx: Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0],
  accountId: string,
  event: RevenueCatWebhookEvent,
  products: Record<string, RevenueCatProductEntry>,
  occurredAt: Date,
  now: Date,
): Promise<boolean> {
  const customer = eventCustomerInfo(event);
  const { amountMinor, currency } = eventMoney(event);
  const product = resolveProduct(event.product_id, products);
  const periodMs =
    event.expiration_at_ms &&
    event.purchased_at_ms &&
    event.expiration_at_ms > event.purchased_at_ms
      ? event.expiration_at_ms - event.purchased_at_ms
      : null;
  const subId =
    event.original_transaction_id ??
    event.transaction_id ??
    `${customer.customerId}:${event.product_id ?? "subscription"}`;
  const chargeId = event.transaction_id ?? event.id;
  const startedAt = event.purchased_at_ms ? new Date(event.purchased_at_ms) : occurredAt;
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;

  const findSub = async () => {
    const [row] = await tx
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.accountId, accountId), eq(subscriptions.stripeSubscriptionId, subId)),
      )
      .for("update");
    return row ?? null;
  };

  const hasSubHistory = async () => {
    const [row] = await tx
      .select({ id: mrrMovements.id })
      .from(mrrMovements)
      .where(
        and(eq(mrrMovements.accountId, accountId), eq(mrrMovements.stripeSubscriptionId, subId)),
      )
      .limit(1);
    return Boolean(row);
  };

  const insertPaymentIfNew = async (amount: number, description: string | null) => {
    if (amount <= 0) return false;
    const [existing] = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.accountId, accountId), eq(payments.stripeChargeId, chargeId)))
      .limit(1);
    if (existing) return false;
    await tx.insert(payments).values({
      accountId,
      stripeChargeId: chargeId,
      stripeCustomerId: customer.customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerCountry: customer.country,
      description,
      amount,
      amountRefunded: 0,
      currency,
      occurredAt,
      origin: "live",
    });
    return true;
  };

  let wrote = false;

  switch (event.type) {
    case "INITIAL_PURCHASE": {
      const isTrial = event.period_type?.toUpperCase() === "TRIAL";
      const mrr = isTrial ? 0 : normalizeMonthlyMrr(amountMinor, product.duration, periodMs);
      const previous = await findSub();
      const values = {
        accountId,
        stripeSubscriptionId: subId,
        stripeCustomerId: customer.customerId,
        customerName: customer.name ?? previous?.customerName ?? null,
        customerEmail: customer.email ?? previous?.customerEmail ?? null,
        customerCountry: customer.country ?? previous?.customerCountry ?? null,
        status: isTrial ? "trialing" : "active",
        currency,
        mrr,
        planName: product.planName ?? previous?.planName ?? null,
        billingInterval: billingIntervalOf(product.duration, periodMs),
        startedAt: previous?.startedAt ?? startedAt,
        trialEndsAt: isTrial ? expiresAt : null,
        canceledAt: null,
        endedAt: null,
        cancelAtPeriodEnd: false,
        lastSeenAt: now,
      };
      if (previous) {
        await tx.update(subscriptions).set(values).where(eq(subscriptions.id, previous.id));
      } else {
        await tx.insert(subscriptions).values(values);
      }

      if (!isTrial && mrr > 0) {
        const previousMrr = previous?.mrr ?? 0;
        if (mrr !== previousMrr) {
          const kind: MrrMovementKind =
            previousMrr === 0
              ? (await hasSubHistory())
                ? "reactivation"
                : "new"
              : mrr > previousMrr
                ? "expansion"
                : "contraction";
          await tx.insert(mrrMovements).values({
            accountId,
            stripeSubscriptionId: subId,
            stripeCustomerId: customer.customerId,
            customerName: values.customerName,
            customerCountry: values.customerCountry,
            planName: values.planName,
            kind,
            amount: mrr - previousMrr,
            currency,
            occurredAt,
            origin: "live",
            stripeEventId: event.id,
          });
          wrote = true;
        }
      }
      if (!isTrial && amountMinor > 0) {
        wrote = (await insertPaymentIfNew(amountMinor, product.planName)) || wrote;
      }
      return wrote;
    }

    case "RENEWAL": {
      if (amountMinor > 0) {
        wrote = (await insertPaymentIfNew(amountMinor, product.planName)) || wrote;
      }
      const mrr = normalizeMonthlyMrr(amountMinor, product.duration, periodMs);
      const previous = await findSub();
      const previousMrr = previous?.mrr ?? 0;
      const values = {
        accountId,
        stripeSubscriptionId: subId,
        stripeCustomerId: customer.customerId,
        customerName: customer.name ?? previous?.customerName ?? null,
        customerEmail: customer.email ?? previous?.customerEmail ?? null,
        customerCountry: customer.country ?? previous?.customerCountry ?? null,
        status: "active",
        currency,
        mrr,
        planName: product.planName ?? previous?.planName ?? null,
        billingInterval:
          billingIntervalOf(product.duration, periodMs) ?? previous?.billingInterval ?? null,
        startedAt: previous?.startedAt ?? startedAt,
        trialEndsAt: previous?.trialEndsAt ?? null,
        canceledAt: null,
        endedAt: null,
        cancelAtPeriodEnd: false,
        lastSeenAt: now,
      };
      if (previous) {
        await tx.update(subscriptions).set(values).where(eq(subscriptions.id, previous.id));
      } else {
        await tx.insert(subscriptions).values(values);
      }

      // Only record an MRR movement on renewal when it's a trial conversion, reactivation, or price change.
      const shouldRecordNew =
        Boolean(event.is_trial_conversion) || (previous !== null && previousMrr === 0);
      if (mrr > 0 && (shouldRecordNew || (previous !== null && mrr !== previousMrr))) {
        const delta = shouldRecordNew ? mrr : mrr - previousMrr;
        if (delta !== 0) {
          const kind: MrrMovementKind = shouldRecordNew
            ? event.is_trial_conversion
              ? "new"
              : (await hasSubHistory())
                ? "reactivation"
                : "new"
            : delta > 0
              ? "expansion"
              : "contraction";
          await tx.insert(mrrMovements).values({
            accountId,
            stripeSubscriptionId: subId,
            stripeCustomerId: customer.customerId,
            customerName: values.customerName,
            customerCountry: values.customerCountry,
            planName: values.planName,
            kind,
            amount: delta,
            currency,
            occurredAt,
            origin: "live",
            stripeEventId: event.id,
          });
          wrote = true;
        }
      }
      return wrote;
    }

    case "NON_RENEWING_PURCHASE": {
      if (amountMinor > 0) {
        return insertPaymentIfNew(amountMinor, product.planName);
      }
      return false;
    }

    case "CANCELLATION": {
      const isRefund = event.cancel_reason?.toUpperCase() === "CUSTOMER_SUPPORT";
      if (isRefund && event.transaction_id) {
        const [existingPayment] = await tx
          .select({ id: payments.id, amount: payments.amount })
          .from(payments)
          .where(
            and(
              eq(payments.accountId, accountId),
              eq(payments.stripeChargeId, event.transaction_id),
            ),
          )
          .limit(1);
        if (existingPayment) {
          const refunded =
            amountMinor < 0
              ? Math.min(existingPayment.amount, -amountMinor)
              : existingPayment.amount;
          await tx
            .update(payments)
            .set({ amountRefunded: refunded })
            .where(eq(payments.id, existingPayment.id));
        }
      }

      const previous = await findSub();
      const scheduled =
        !isRefund && expiresAt !== null && expiresAt.getTime() > occurredAt.getTime();
      const reason = mapCancelReason(event.cancel_reason, scheduled);
      const lostMrr =
        previous && previous.mrr > 0
          ? previous.mrr
          : !previous && Math.abs(amountMinor) > 0
            ? normalizeMonthlyMrr(Math.abs(amountMinor), product.duration, periodMs)
            : 0;

      if (previous) {
        await tx
          .update(subscriptions)
          .set({
            status: scheduled ? previous.status : reason === "unpaid" ? "unpaid" : "canceled",
            mrr: 0,
            cancelAtPeriodEnd: scheduled,
            canceledAt: occurredAt,
            endedAt: scheduled ? previous.endedAt : occurredAt,
            lastSeenAt: now,
          })
          .where(eq(subscriptions.id, previous.id));
      } else if (lostMrr > 0) {
        await tx.insert(subscriptions).values({
          accountId,
          stripeSubscriptionId: subId,
          stripeCustomerId: customer.customerId,
          customerName: customer.name,
          customerEmail: customer.email,
          customerCountry: customer.country,
          status: scheduled ? "active" : "canceled",
          currency,
          mrr: 0,
          planName: product.planName,
          billingInterval: billingIntervalOf(product.duration, periodMs),
          startedAt,
          canceledAt: occurredAt,
          endedAt: scheduled ? null : occurredAt,
          cancelAtPeriodEnd: scheduled,
          lastSeenAt: now,
        });
      }

      if (lostMrr > 0) {
        await tx.insert(mrrMovements).values({
          accountId,
          stripeSubscriptionId: subId,
          stripeCustomerId: customer.customerId,
          customerName: customer.name ?? previous?.customerName ?? null,
          customerCountry: customer.country ?? previous?.customerCountry ?? null,
          planName: product.planName ?? previous?.planName ?? null,
          kind: "churn",
          churnReason: reason,
          endsAt: reason === "scheduled" ? expiresAt : null,
          amount: -lostMrr,
          currency: previous?.currency ?? currency,
          occurredAt,
          origin: "live",
          stripeEventId: event.id,
        });
        wrote = true;
      }
      return wrote;
    }

    case "UNCANCELLATION": {
      const previous = await findSub();
      const restoredMrr =
        amountMinor > 0
          ? normalizeMonthlyMrr(amountMinor, product.duration, periodMs)
          : await lastChurnedMrr(tx, accountId, subId);
      if (previous) {
        await tx
          .update(subscriptions)
          .set({
            status: "active",
            mrr: restoredMrr || previous.mrr,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            endedAt: null,
            lastSeenAt: now,
          })
          .where(eq(subscriptions.id, previous.id));
      }
      if (restoredMrr > 0 && (previous?.mrr ?? 0) === 0) {
        await tx.insert(mrrMovements).values({
          accountId,
          stripeSubscriptionId: subId,
          stripeCustomerId: customer.customerId,
          customerName: customer.name ?? previous?.customerName ?? null,
          customerCountry: customer.country ?? previous?.customerCountry ?? null,
          planName: product.planName ?? previous?.planName ?? null,
          kind: "reactivation",
          amount: restoredMrr,
          currency: previous?.currency ?? currency,
          occurredAt,
          origin: "live",
          stripeEventId: event.id,
        });
        wrote = true;
      }
      return wrote;
    }

    case "EXPIRATION": {
      const previous = await findSub();
      if (!previous) return false;
      const reason = mapCancelReason(event.expiration_reason, false);
      await tx
        .update(subscriptions)
        .set({
          status: reason === "paused" ? "paused" : reason === "unpaid" ? "unpaid" : "canceled",
          mrr: 0,
          endedAt: previous.endedAt ?? occurredAt,
          lastSeenAt: now,
        })
        .where(eq(subscriptions.id, previous.id));
      if (previous.mrr > 0) {
        await tx.insert(mrrMovements).values({
          accountId,
          stripeSubscriptionId: subId,
          stripeCustomerId: customer.customerId,
          customerName: customer.name ?? previous.customerName,
          customerCountry: customer.country ?? previous.customerCountry,
          planName: product.planName ?? previous.planName,
          kind: "churn",
          churnReason: reason,
          amount: -previous.mrr,
          currency: previous.currency,
          occurredAt,
          origin: "live",
          stripeEventId: event.id,
        });
        wrote = true;
      }
      return wrote;
    }

    case "SUBSCRIPTION_PAUSED": {
      const previous = await findSub();
      if (!previous) return false;
      await tx
        .update(subscriptions)
        .set({ status: "paused", mrr: 0, lastSeenAt: now })
        .where(eq(subscriptions.id, previous.id));
      if (previous.mrr > 0) {
        await tx.insert(mrrMovements).values({
          accountId,
          stripeSubscriptionId: subId,
          stripeCustomerId: customer.customerId,
          customerName: customer.name ?? previous.customerName,
          customerCountry: customer.country ?? previous.customerCountry,
          planName: product.planName ?? previous.planName,
          kind: "churn",
          churnReason: "paused",
          amount: -previous.mrr,
          currency: previous.currency,
          occurredAt,
          origin: "live",
          stripeEventId: event.id,
        });
        wrote = true;
      }
      return wrote;
    }

    default:
      return false;
  }
}

async function lastChurnedMrr(
  tx: Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0],
  accountId: string,
  subId: string,
): Promise<number> {
  const [row] = await tx
    .select({ amount: mrrMovements.amount })
    .from(mrrMovements)
    .where(
      and(
        eq(mrrMovements.accountId, accountId),
        eq(mrrMovements.stripeSubscriptionId, subId),
        eq(mrrMovements.kind, "churn"),
      ),
    )
    .orderBy(desc(mrrMovements.occurredAt))
    .limit(1);
  return row ? Math.abs(row.amount) : 0;
}

import "server-only";
import { BlockList, isIP } from "node:net";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "@/db";
import { stripeAccounts } from "@/db/schema";
import { env } from "@/env";
import type { ActionResult } from "@/lib/action-result";
import { siteConfig } from "@/lib/site";
import { permissionLabel } from "@/lib/stripe-permissions";
import { decryptSecret, encryptSecret } from "@/server/crypto";
import { ACCOUNT_NOT_FOUND, StripeAccessError } from "./errors";
import { SYNC_EVENT_TYPES } from "./event-types";
import { createStripeGateway, type StripeAccessOptions, type StripeGateway } from "./gateway";

/*
 * Webhooks only make syncs instant: an incoming event marks the account as needing a sync, and
 * the sync reads the Events API as usual. Without a webhook, the account is polled instead.
 */

function webhookEndpointUrl(accountId: string): string {
  return `${env().APP_URL}/api/webhooks/stripe/${accountId}`;
}

const NOT_A_SIGNING_SECRET =
  "This doesn’t look like a signing secret. It starts with whsec_ and is shown on the endpoint’s page.";

/** The signing secret (`whsec_…`) of an endpoint added by hand in the Stripe Dashboard. */
export const webhookSigningSecretSchema = z
  .string()
  .trim()
  .max(500, NOT_A_SIGNING_SECRET)
  .regex(/^whsec_[A-Za-z0-9+/=]{16,}$/, NOT_A_SIGNING_SECRET);

/** Loopback, private, link-local and carrier-grade NAT ranges Stripe cannot reach. */
function unreachableAddresses(): BlockList {
  const list = new BlockList();
  for (const [network, prefix] of [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.168.0.0", 16],
  ] as const) {
    list.addSubnet(network, prefix, "ipv4");
  }
  for (const [network, prefix] of [
    ["::", 127],
    ["fc00::", 7],
    ["fe80::", 10],
  ] as const) {
    list.addSubnet(network, prefix, "ipv6");
  }
  return list;
}

/** Stripe only delivers webhooks to public HTTPS URLs. */
export function isPublicHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase().replace(/^\[(.*)\]$/, "$1");
  const ipVersion = isIP(host);
  if (ipVersion) return !unreachableAddresses().check(host, ipVersion === 4 ? "ipv4" : "ipv6");
  const isLocalName =
    !host.includes(".") || /\.(localhost|local|internal|lan|home\.arpa)$/.test(host);
  return !isLocalName;
}

export type WebhookRegistration =
  { ok: true } | { ok: false; reason: "private_url" | "refused" | "unavailable" };

/**
 * Asks Stripe to send the sync events to this app. Needs a public HTTPS `APP_URL` and the
 * "Webhook Endpoints: Write" permission; without them the account is polled instead.
 */
export async function registerWebhookEndpoint(
  accountId: string,
  gateway: StripeGateway,
): Promise<WebhookRegistration> {
  const url = webhookEndpointUrl(accountId);
  if (!isPublicHttpsUrl(url)) return { ok: false, reason: "private_url" };

  let endpoint: { id: string; secret: string };
  try {
    endpoint = await gateway.createWebhookEndpoint({
      url,
      events: SYNC_EVENT_TYPES,
      description: `${siteConfig.name}: instant updates for your wall screens`,
      metadata: { app: "saas-monitor", account_id: accountId },
    });
  } catch (error) {
    if (!(error instanceof StripeAccessError)) throw error;
    // Most likely a key without the optional write permission: polling works without it.
    return { ok: false, reason: error.isTransient ? "unavailable" : "refused" };
  }

  await db()
    .update(stripeAccounts)
    .set({ webhookEndpointId: endpoint.id, encryptedWebhookSecret: encryptSecret(endpoint.secret) })
    .where(eq(stripeAccounts.id, accountId));
  return { ok: true };
}

/**
 * Registers a webhook endpoint through the API (needs the "Webhook Endpoints: Write" permission
 * and a public HTTPS `APP_URL`). Returns a user-facing error when it is not possible.
 */
export async function enableInstantUpdates(
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
  if (account.webhookEndpointId) return { ok: true };

  const gateway = (options.createGateway ?? createStripeGateway)(
    decryptSecret(account.encryptedSecretKey),
  );
  const registration = await registerWebhookEndpoint(accountId, gateway);
  if (registration.ok) return { ok: true };
  const errors = {
    private_url:
      "Stripe can only send updates to a public HTTPS address. Set APP_URL to the public URL of this app.",
    refused: `Stripe refused to create the webhook. Give the key the “${permissionLabel("rak_webhook_write")}” permission, or add the endpoint manually.`,
    unavailable: "Stripe could not be reached. Try again in a moment.",
  };
  return { ok: false, error: errors[registration.reason] };
}

/** Stores the signing secret (`whsec_…`) of an endpoint the user created in the Dashboard. */
export async function setWebhookSigningSecret(
  workspaceId: string,
  accountId: string,
  signingSecret: string,
): Promise<ActionResult> {
  const updated = await db()
    .update(stripeAccounts)
    .set({ encryptedWebhookSecret: encryptSecret(signingSecret) })
    .where(and(eq(stripeAccounts.workspaceId, workspaceId), eq(stripeAccounts.id, accountId)))
    .returning({ id: stripeAccounts.id });
  return updated.length ? { ok: true } : ACCOUNT_NOT_FOUND;
}

/** Endpoint URL and events to configure when adding the webhook manually in the Dashboard. */
export function webhookSetupInstructions(accountId: string): { url: string; events: string[] } {
  return { url: webhookEndpointUrl(accountId), events: [...SYNC_EVENT_TYPES] };
}

export type WebhookReception = "accepted" | "unknown_account" | "invalid_signature";

/**
 * Verifies an incoming webhook and flags the account for a sync. The event itself is not used:
 * the sync reads it (and anything missed) from the Events API, so there is a single code path.
 */
export async function receiveWebhook(
  accountId: string,
  payload: string,
  signature: string | null,
): Promise<WebhookReception> {
  const [account] = await db()
    .select({ encryptedWebhookSecret: stripeAccounts.encryptedWebhookSecret })
    .from(stripeAccounts)
    .where(eq(stripeAccounts.id, accountId));
  if (!account) return "unknown_account";
  if (!account.encryptedWebhookSecret || !signature) return "invalid_signature";

  try {
    Stripe.webhooks.constructEvent(
      payload,
      signature,
      decryptSecret(account.encryptedWebhookSecret),
    );
  } catch {
    return "invalid_signature";
  }

  const now = new Date();
  await db()
    .update(stripeAccounts)
    .set({ syncRequestedAt: now, lastWebhookAt: now })
    .where(eq(stripeAccounts.id, accountId));
  return "accepted";
}

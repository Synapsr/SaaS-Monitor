import "server-only";

export type ConnectStripeAccountResult =
  { ok: true; accountId: string } | { ok: false; error: string; missingPermissions?: string[] };

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

/**
 * Checks `secretKey` against Stripe, stores it encrypted in `workspaceId`, tries to register a
 * webhook for instant updates and starts the first import. Returns a user-facing error when the
 * key is invalid or lacks read permissions.
 */
export async function connectStripeAccount(input: {
  workspaceId: string;
  name: string;
  secretKey: string;
}): Promise<ConnectStripeAccountResult> {
  void input;
  throw new Error("connectStripeAccount is not implemented yet.");
}

export async function listStripeAccountSummaries(
  workspaceId: string,
): Promise<StripeAccountSummary[]> {
  void workspaceId;
  throw new Error("listStripeAccountSummaries is not implemented yet.");
}

export async function renameStripeAccount(workspaceId: string, accountId: string, name: string) {
  void workspaceId;
  void accountId;
  void name;
  throw new Error("renameStripeAccount is not implemented yet.");
}

/** Deletes the account, its imported data and the webhook endpoint the app created. */
export async function disconnectStripeAccount(workspaceId: string, accountId: string) {
  void workspaceId;
  void accountId;
  throw new Error("disconnectStripeAccount is not implemented yet.");
}

/** Drops the imported data and imports the account again from scratch. */
export async function reimportStripeAccount(workspaceId: string, accountId: string) {
  void workspaceId;
  void accountId;
  throw new Error("reimportStripeAccount is not implemented yet.");
}

/**
 * Registers a webhook endpoint through the API (needs the "Webhook Endpoints: Write" permission
 * and a public HTTPS `APP_URL`). Returns a user-facing error when it is not possible.
 */
export async function enableInstantUpdates(
  workspaceId: string,
  accountId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  void workspaceId;
  void accountId;
  throw new Error("enableInstantUpdates is not implemented yet.");
}

/** Stores the signing secret (`whsec_…`) of an endpoint the user created in the Dashboard. */
export async function setWebhookSigningSecret(
  workspaceId: string,
  accountId: string,
  secret: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  void workspaceId;
  void accountId;
  void secret;
  throw new Error("setWebhookSigningSecret is not implemented yet.");
}

/** Endpoint URL and events to configure when adding the webhook manually in the Dashboard. */
export function webhookSetupInstructions(accountId: string): { url: string; events: string[] } {
  void accountId;
  throw new Error("webhookSetupInstructions is not implemented yet.");
}

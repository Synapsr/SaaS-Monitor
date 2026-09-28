import "server-only";
import Stripe from "stripe";
import { permissionLabel } from "@/lib/stripe-permissions";

export type StripeErrorKind =
  /** 401: the key is invalid, revoked or was rolled. */
  | "authentication"
  /** 403: a restricted key lacks a permission. */
  | "permission"
  | "not_found"
  /** 429: too many requests; retry later. */
  | "rate_limited"
  /** Network failure, timeout or Stripe outage; retry later. */
  | "unavailable"
  /** Any other rejected request, most likely a bug on our side. */
  | "invalid_request";

/**
 * A failed Stripe request, independent of the SDK: the sync engine and the fake gateway used in
 * tests only deal with this type.
 */
export class StripeAccessError extends Error {
  readonly kind: StripeErrorKind;
  /** The missing permission (e.g. `rak_charge_read`), for `permission` errors. */
  readonly permission: string | null;
  /** The `acct_…` Stripe mentions in permission errors: the key's account, even when unreadable. */
  readonly stripeAccountId: string | null;

  constructor(
    kind: StripeErrorKind,
    message: string,
    details: { permission?: string | null; stripeAccountId?: string | null } = {},
  ) {
    super(message);
    this.name = "StripeAccessError";
    this.kind = kind;
    this.permission = details.permission ?? null;
    this.stripeAccountId = details.stripeAccountId ?? null;
  }

  /** Worth retrying later without any change on the user's side. */
  get isTransient(): boolean {
    return this.kind === "rate_limited" || this.kind === "unavailable";
  }
}

/** Converts SDK errors to `StripeAccessError`; anything else is returned unchanged. */
export function toStripeAccessError(error: unknown): unknown {
  if (!(error instanceof Stripe.errors.StripeError)) return error;

  const message = redactSecrets(error.message);
  if (error instanceof Stripe.errors.StripeConnectionError) {
    return new StripeAccessError("unavailable", message);
  }
  switch (error.statusCode) {
    case 401:
      return new StripeAccessError("authentication", message);
    case 403:
      return new StripeAccessError("permission", message, {
        permission: message.match(/\brak_[a-z_]+/)?.[0] ?? null,
        stripeAccountId: message.match(/\bacct_[A-Za-z0-9]+/)?.[0] ?? null,
      });
    case 404:
      return new StripeAccessError("not_found", message);
    case 429:
      return new StripeAccessError("rate_limited", message);
  }
  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return new StripeAccessError("rate_limited", message);
  }
  return error.statusCode === undefined || error.statusCode >= 500
    ? new StripeAccessError("unavailable", message)
    : new StripeAccessError("invalid_request", message);
}

/**
 * Stripe masks keys in its messages; this also strips anything that could look like a secret
 * before a message reaches logs or the database.
 */
export function redactSecrets(text: string): string {
  return text.replace(/\b((?:sk|rk|pk)_(?:live|test)_|whsec_)[A-Za-z0-9*]+/g, "$1…");
}

/** User-facing explanation of an error that needs the user to act, shown in the dashboard. */
export function describeAccessError(error: StripeAccessError): string {
  if (error.kind === "authentication") {
    return "This Stripe key was revoked or rolled. Connect the account again with a new key.";
  }
  if (error.kind === "permission") {
    return error.permission
      ? `This Stripe key is missing the “${permissionLabel(error.permission)}” permission. Edit the key in the Stripe Dashboard to add it.`
      : "This Stripe key is missing a permission. Edit the key in the Stripe Dashboard and allow every permission listed in the setup guide.";
  }
  return "Stripe could not be reached. We will try again shortly.";
}

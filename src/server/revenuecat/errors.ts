import "server-only";
import { revenueCatPermissionLabel } from "@/lib/revenuecat-permissions";

export type RevenueCatErrorKind =
  /** 401: the key is invalid, revoked or is a v1 key. */
  | "authentication"
  /** 403: the v2 key lacks a required permission or project access. */
  | "permission"
  | "not_found"
  /** 429: rate limit exceeded for the endpoint's domain; retry later. */
  | "rate_limited"
  /** Network failure, timeout or RevenueCat outage; retry later. */
  | "unavailable"
  /** Any other rejected request (400/422). */
  | "invalid_request";

export class RevenueCatAccessError extends Error {
  readonly kind: RevenueCatErrorKind;
  readonly permission: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    kind: RevenueCatErrorKind,
    message: string,
    details: { permission?: string | null; retryAfterSeconds?: number | null } = {},
  ) {
    super(message);
    this.name = "RevenueCatAccessError";
    this.kind = kind;
    this.permission = details.permission ?? null;
    this.retryAfterSeconds = details.retryAfterSeconds ?? null;
  }

  get isTransient(): boolean {
    return this.kind === "rate_limited" || this.kind === "unavailable";
  }
}

/** Strips anything that looks like a RevenueCat secret key before logs or database writes. */
export function redactRevenueCatSecrets(text: string): string {
  return text.replace(/\b(sk_)[A-Za-z0-9_-]{8,}/g, "$1…");
}

export const REVENUECAT_UNREADABLE_KEY_ERROR =
  "The saved RevenueCat key can no longer be decrypted (was ENCRYPTION_KEY changed?). Connect the account again.";

export function describeRevenueCatAccessError(error: RevenueCatAccessError): string {
  if (error.kind === "authentication") {
    return "This RevenueCat key was revoked or is not a valid v2 secret key. Connect the account again with a new key.";
  }
  if (error.kind === "permission") {
    return error.permission
      ? `This RevenueCat key is missing the “${revenueCatPermissionLabel(error.permission)}” permission. Edit the key in RevenueCat to add it.`
      : "This RevenueCat key is missing a permission. Edit the key in RevenueCat and allow the permissions listed in the setup guide.";
  }
  return "RevenueCat could not be reached. We will try again shortly.";
}

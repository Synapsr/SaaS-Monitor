import "server-only";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";

/** A RevenueCat API v2 secret key whose format was checked. */
export interface RevenueCatSecretKey {
  key: string;
  /** Masked key, e.g. `sk_…4f2a`. */
  hint: string;
}

const STRIPE_KEY_PREFIX = /^(?:sk|rk|pk)_(?:live|test)_/;
const PUBLIC_SDK_KEY_PREFIX = /^(?:appl|goog|amzn|strp|rcb|test)_/;
const SECRET_KEY_PATTERN = /^sk_[A-Za-z0-9_-]{16,}$/;

/** Checks the format of a pasted RevenueCat API v2 secret key before sending it to RevenueCat. */
export function inspectRevenueCatSecretKey(input: string): ActionResult<RevenueCatSecretKey> {
  const key = input.trim();
  if (STRIPE_KEY_PREFIX.test(key)) {
    return {
      ok: false,
      error: "This looks like a Stripe key. Paste a RevenueCat API v2 secret key instead.",
    };
  }
  if (PUBLIC_SDK_KEY_PREFIX.test(key)) {
    return {
      ok: false,
      error: "This is a public SDK key. Paste a secret API v2 key instead (it starts with sk_).",
    };
  }
  if (!SECRET_KEY_PATTERN.test(key)) {
    return {
      ok: false,
      error: "This doesn’t look like a RevenueCat secret key. API v2 secret keys start with sk_.",
    };
  }
  return { ok: true, key, hint: `sk_…${key.slice(-4)}` };
}

/** A pasted API key, read into a `RevenueCatSecretKey`. */
export const revenueCatSecretKeySchema = z
  .string()
  .max(500, "This doesn’t look like a RevenueCat secret key.")
  .transform((input, context): RevenueCatSecretKey => {
    const inspection = inspectRevenueCatSecretKey(input);
    if (!inspection.ok) {
      context.addIssue({ code: "custom", message: inspection.error });
      return z.NEVER;
    }
    return { key: inspection.key, hint: inspection.hint };
  });

/** Optional RevenueCat project id (`proj…`), needed only when a key can read multiple projects. */
export const revenueCatProjectIdSchema = z
  .string()
  .trim()
  .max(255)
  .transform((value) => (value.length ? value : undefined))
  .optional();

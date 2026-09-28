import "server-only";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";

/** A Stripe API key whose format was checked. */
export interface SecretKey {
  key: string;
  livemode: boolean;
  /** Masked key, e.g. `rk_live_…4f2a`. */
  hint: string;
}

// Secret (`sk_`) and restricted (`rk_`) keys; sandboxes use `_test_` keys too.
const SECRET_KEY_PATTERN = /^((?:sk|rk)_(live|test)_)[A-Za-z0-9]{16,}$/;

/** Checks the format of a pasted API key before sending it to Stripe. */
export function inspectSecretKey(input: string): ActionResult<SecretKey> {
  const key = input.trim();
  if (/^pk_(live|test)_/.test(key)) {
    return {
      ok: false,
      error: "This is a publishable key. Paste a restricted key instead (it starts with rk_).",
    };
  }
  const match = SECRET_KEY_PATTERN.exec(key);
  if (!match) {
    return {
      ok: false,
      error:
        "This doesn't look like a Stripe API key. Restricted keys start with rk_live_ or rk_test_.",
    };
  }
  const [, prefix, mode] = match;
  return { ok: true, key, livemode: mode === "live", hint: `${prefix}…${key.slice(-4)}` };
}

/** A pasted API key, read into a `SecretKey`: how actions validate the key of a connection. */
export const secretKeySchema = z
  .string()
  .max(500, "This doesn't look like a Stripe API key.")
  .transform((input, context): SecretKey => {
    const inspection = inspectSecretKey(input);
    if (!inspection.ok) {
      context.addIssue({ code: "custom", message: inspection.error });
      return z.NEVER;
    }
    return { key: inspection.key, livemode: inspection.livemode, hint: inspection.hint };
  });

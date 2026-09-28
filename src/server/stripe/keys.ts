import "server-only";

export type SecretKeyInspection =
  { ok: true; key: string; livemode: boolean; hint: string } | { ok: false; error: string };

// Secret (`sk_`) and restricted (`rk_`) keys; sandboxes use `_test_` keys too.
const SECRET_KEY_PATTERN = /^((?:sk|rk)_(live|test)_)[A-Za-z0-9]{16,}$/;

/** Checks the format of a pasted API key before sending it to Stripe. */
export function inspectSecretKey(input: string): SecretKeyInspection {
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

import "server-only";
import { createPrivateKey } from "node:crypto";

/**
 * The `.p8` key of `APNS_PRIVATE_KEY`, however a hosting panel kept it: with its lines, its line
 * breaks escaped as `\n` (once or twice), wrapped in quotes, or folded into spaces. The PEM is
 * rebuilt from its base64 body. `null` when it still isn't a private key.
 */
export function readP8(value: string): string | null {
  const body = value
    // Base64 has no backslash: any `\n` or `\r` is an escaped line break.
    .replace(/\\+[nr]/g, " ")
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, " ")
    .replace(/["'\s]/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body)) return null;
  const pem = `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)?.join("\n")}\n-----END PRIVATE KEY-----\n`;
  try {
    createPrivateKey(pem);
    return pem;
  } catch {
    return null;
  }
}

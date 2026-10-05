import "server-only";
import { sign, type KeyObject } from "node:crypto";

/**
 * A signed JSON Web Token: ES256 for Apple's provider tokens, RS256 for Google's service
 * accounts. Both are a few lines with `node:crypto`, not worth a dependency.
 */
export function signJwt(
  algorithm: "ES256" | "RS256",
  header: Record<string, string>,
  claims: Record<string, string | number>,
  key: KeyObject,
): string {
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString("base64url");
  const input = `${encode({ alg: algorithm, ...header })}.${encode(claims)}`;
  // JWTs carry ECDSA signatures as `r || s`, not in the DER encoding Node uses by default.
  const signature =
    algorithm === "ES256"
      ? sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" })
      : sign("sha256", Buffer.from(input), key);
  return `${input}.${signature.toString("base64url")}`;
}

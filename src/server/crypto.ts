import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const FORMAT_VERSION = "v1";

function encryptionKey(): Buffer {
  return Buffer.from(env().ENCRYPTION_KEY, "hex");
}

/** Encrypts a secret for storage as `v1.<iv>.<auth tag>.<ciphertext>` (base64url parts). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [FORMAT_VERSION, iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

/** Decrypts a value produced by `encryptSecret`. Throws if it was tampered with. */
export function decryptSecret(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(".");
  if (version !== FORMAT_VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Unsupported encrypted secret format.");
  }
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

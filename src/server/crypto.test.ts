import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

describe("secret encryption", () => {
  it("round-trips a secret", () => {
    const secret = "rk_test_51Abc";
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it("uses a fresh IV for every encryption", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects tampered payloads", () => {
    const [version, iv, tag, ciphertext] = encryptSecret("rk_test_51Abc").split(".");
    const flipped = Buffer.from(ciphertext, "base64url");
    flipped[0] ^= 1;
    const tampered = [version, iv, tag, flipped.toString("base64url")].join(".");
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("rejects unknown formats", () => {
    expect(() => decryptSecret("plaintext")).toThrow("Unsupported encrypted secret format.");
  });
});

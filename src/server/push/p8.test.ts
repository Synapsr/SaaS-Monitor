import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { readP8 } from "./p8";

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

function sameKey(read: string | null): boolean {
  if (read === null) return false;
  const der = (key: string) => createPrivateKey(key).export({ type: "pkcs8", format: "der" });
  return der(read).equals(der(pem));
}

describe("readP8", () => {
  it("reads a .p8 key as Apple hands it out", () => {
    expect(sameKey(readP8(pem))).toBe(true);
  });

  it("reads it however a hosting panel kept it", () => {
    const lines = pem.trim().split("\n");
    for (const kept of [
      lines.join("\\n"),
      lines.join("\\\\n"),
      `"${lines.join("\\n")}"`,
      lines.join(" "),
      lines.join("\r\n"),
      `  ${pem}  `,
      lines.slice(1, -1).join(""),
    ]) {
      expect(sameKey(readP8(kept))).toBe(true);
    }
  });

  it("refuses anything else", () => {
    for (const value of [
      "",
      "not a key",
      "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----",
    ]) {
      expect(readP8(value)).toBeNull();
    }
  });
});

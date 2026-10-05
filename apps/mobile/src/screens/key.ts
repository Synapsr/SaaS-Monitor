import * as Crypto from "expo-crypto";

/**
 * A screen's key: the first 16 hex characters of the SHA-256 of its token. Stable and opaque, it
 * names the screen in notifications (`data.screen`), widgets and watches, without its token.
 */
export async function screenKey(token: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
  return digest.slice(0, 16).toLowerCase();
}

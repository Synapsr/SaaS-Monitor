import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { formatProductId, verifyRevenueCatWebhook } from "./webhooks";

describe("verifyRevenueCatWebhook", () => {
  const payload = JSON.stringify({ api_version: "1.0", event: { id: "evt_1", type: "RENEWAL" } });
  const nowSeconds = 1_700_000_000;

  it("verifies a valid X-RevenueCat-Webhook-Signature HMAC header", () => {
    const secret = "rc_signing_secret_1234567890";
    const sig = createHmac("sha256", secret).update(`${nowSeconds}.${payload}`).digest("hex");
    const header = `t=${nowSeconds},v1=${sig}`;

    expect(
      verifyRevenueCatWebhook(
        payload,
        { signature: header, authorization: null },
        secret,
        nowSeconds,
      ),
    ).toBe(true);
  });

  it("rejects an expired or tampered HMAC signature", () => {
    const secret = "rc_signing_secret_1234567890";
    const staleTs = nowSeconds - 600;
    const staleSig = createHmac("sha256", secret).update(`${staleTs}.${payload}`).digest("hex");

    expect(
      verifyRevenueCatWebhook(
        payload,
        { signature: `t=${staleTs},v1=${staleSig}`, authorization: null },
        secret,
        nowSeconds,
      ),
    ).toBe(false);

    expect(
      verifyRevenueCatWebhook(
        `${payload} `,
        {
          signature: `t=${nowSeconds},v1=${createHmac("sha256", secret).update(`${nowSeconds}.${payload}`).digest("hex")}`,
          authorization: null,
        },
        secret,
        nowSeconds,
      ),
    ).toBe(false);
  });

  it("verifies an Authorization header (with or without Bearer prefix)", () => {
    expect(
      verifyRevenueCatWebhook(
        payload,
        { signature: null, authorization: "Bearer my-webhook-token" },
        "Bearer my-webhook-token",
        nowSeconds,
      ),
    ).toBe(true);

    expect(
      verifyRevenueCatWebhook(
        payload,
        { signature: null, authorization: "Bearer my-webhook-token" },
        "my-webhook-token",
        nowSeconds,
      ),
    ).toBe(true);

    expect(
      verifyRevenueCatWebhook(
        payload,
        { signature: null, authorization: "Bearer wrong-token" },
        "Bearer my-webhook-token",
        nowSeconds,
      ),
    ).toBe(false);
  });

  it("verifies JSON-encoded stored secrets created via API v2", () => {
    const stored = JSON.stringify({
      authHeader: "Bearer rcwh_secret_abc",
      signingSecret: "hmac_secret_xyz",
    });

    expect(
      verifyRevenueCatWebhook(
        payload,
        { signature: null, authorization: "Bearer rcwh_secret_abc" },
        stored,
        nowSeconds,
      ),
    ).toBe(true);

    const sig = createHmac("sha256", "hmac_secret_xyz")
      .update(`${nowSeconds}.${payload}`)
      .digest("hex");
    expect(
      verifyRevenueCatWebhook(
        payload,
        { signature: `t=${nowSeconds},v1=${sig}`, authorization: null },
        stored,
        nowSeconds,
      ),
    ).toBe(true);
  });
});

describe("formatProductId", () => {
  it("turns store product identifiers into readable plan names", () => {
    expect(formatProductId("com.acme.pro_monthly")).toBe("Pro Monthly");
    expect(formatProductId("premium_yearly:p1y")).toBe("Premium Yearly");
  });
});

import { describe, expect, it } from "vitest";
import { isPublicHttpsUrl, webhookSigningSecretSchema } from "./webhooks";

describe("public webhook URLs", () => {
  it("accepts public HTTPS addresses", () => {
    expect(isPublicHttpsUrl("https://monitor.example.com/api/webhooks/stripe/1")).toBe(true);
    expect(isPublicHttpsUrl("https://203.0.113.10/hook")).toBe(true);
    expect(isPublicHttpsUrl("https://[2001:db8::1]/hook")).toBe(true);
  });

  it("rejects addresses Stripe cannot reach", () => {
    for (const url of [
      "http://monitor.example.com/hook",
      "https://localhost:3000/hook",
      "https://app.localhost/hook",
      "https://raspberrypi.local/hook",
      "https://monitor/hook",
      "https://127.0.0.1/hook",
      "https://10.0.0.12/hook",
      "https://172.20.1.1/hook",
      "https://192.168.1.20/hook",
      "https://100.100.1.1/hook",
      "https://[::1]/hook",
      "https://[fd12:3456::1]/hook",
      "https://[::ffff:192.168.1.1]/hook",
      "not a url",
    ]) {
      expect(isPublicHttpsUrl(url), url).toBe(false);
    }
  });
});

describe("webhook signing secrets", () => {
  it("accepts the whsec_ format, trimmed", () => {
    expect(webhookSigningSecretSchema.parse(" whsec_4c0eA1b2C3d4E5f6G7h8I9j0K1l2M3n4 \n")).toBe(
      "whsec_4c0eA1b2C3d4E5f6G7h8I9j0K1l2M3n4",
    );
  });

  it("explains where to find a signing secret", () => {
    for (const secret of ["whsec_short", "rk_live_4c0eA1b2C3d4E5f6G7h8I9j0K1l2M3n4", "secret"]) {
      expect(webhookSigningSecretSchema.safeParse(secret).error?.issues[0].message).toMatch(
        /starts with whsec_/,
      );
    }
  });
});

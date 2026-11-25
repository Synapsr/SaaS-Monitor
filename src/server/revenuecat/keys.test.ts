import { describe, expect, it } from "vitest";
import {
  inspectRevenueCatSecretKey,
  revenueCatProjectIdSchema,
  revenueCatSecretKeySchema,
} from "./keys";

describe("inspectRevenueCatSecretKey", () => {
  it("accepts a valid RevenueCat API v2 secret key and masks it", () => {
    const result = inspectRevenueCatSecretKey("  sk_AbCdEfGhIjKlMnOpQrSt1234  ");
    expect(result).toEqual({
      ok: true,
      key: "sk_AbCdEfGhIjKlMnOpQrSt1234",
      hint: "sk_…1234",
    });
  });

  it("rejects Stripe keys with a helpful message", () => {
    const stripeKey = inspectRevenueCatSecretKey("sk_live_1234567890abcdef1234");
    expect(stripeKey.ok).toBe(false);
    if (!stripeKey.ok) expect(stripeKey.error).toContain("Stripe");

    const restrictedKey = inspectRevenueCatSecretKey("rk_test_1234567890abcdef1234");
    expect(restrictedKey.ok).toBe(false);
  });

  it("rejects public RevenueCat SDK keys", () => {
    for (const prefix of ["appl_", "goog_", "amzn_", "strp_", "rcb_", "test_"]) {
      const result = inspectRevenueCatSecretKey(`${prefix}1234567890abcdef1234`);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("public SDK key");
    }
  });

  it("rejects malformed or short keys", () => {
    expect(inspectRevenueCatSecretKey("sk_short").ok).toBe(false);
    expect(inspectRevenueCatSecretKey("not_a_key_at_all_12345678").ok).toBe(false);
  });
});

describe("revenueCatSecretKeySchema", () => {
  it("transforms valid strings into a key and hint", () => {
    const parsed = revenueCatSecretKeySchema.parse("sk_9876543210abcdefWXYZ");
    expect(parsed).toEqual({ key: "sk_9876543210abcdefWXYZ", hint: "sk_…WXYZ" });
  });
});

describe("revenueCatProjectIdSchema", () => {
  it("normalizes blank input to undefined and trims valid ids", () => {
    expect(revenueCatProjectIdSchema.parse("")).toBeUndefined();
    expect(revenueCatProjectIdSchema.parse("   ")).toBeUndefined();
    expect(revenueCatProjectIdSchema.parse("  proj1ab2c3d4  ")).toBe("proj1ab2c3d4");
  });
});

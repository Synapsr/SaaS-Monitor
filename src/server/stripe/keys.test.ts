import { describe, expect, it } from "vitest";
import { inspectSecretKey, secretKeySchema } from "./keys";

describe("API key inspection", () => {
  it("accepts restricted and secret keys and masks them", () => {
    expect(inspectSecretKey("  rk_live_51AbCdEfGhIjKlMnOp4f2a \n")).toEqual({
      ok: true,
      key: "rk_live_51AbCdEfGhIjKlMnOp4f2a",
      livemode: true,
      hint: "rk_live_…4f2a",
    });
    expect(inspectSecretKey("sk_test_4eC39HqLyjWDarjtT1zdp7dc")).toMatchObject({
      ok: true,
      livemode: false,
      hint: "sk_test_…p7dc",
    });
  });

  it("explains what is wrong with other keys", () => {
    expect(inspectSecretKey("pk_live_51AbCdEfGhIjKlMnOp4f2a")).toMatchObject({
      ok: false,
      error: expect.stringContaining("publishable key"),
    });
    for (const key of [
      "",
      "rk_live_",
      "whsec_51AbCdEfGhIjKlMnOp4f2a",
      "rk_prod_51AbCdEfGhIjKlMnOp",
    ]) {
      expect(inspectSecretKey(key)).toMatchObject({ ok: false });
    }
  });
});

describe("API key schema", () => {
  it("reads a pasted key", () => {
    expect(secretKeySchema.parse(" rk_test_51AbCdEfGhIjKlMnOp4f2a ")).toEqual({
      key: "rk_test_51AbCdEfGhIjKlMnOp4f2a",
      livemode: false,
      hint: "rk_test_…4f2a",
    });
  });

  it("explains a publishable key rather than refusing it vaguely", () => {
    expect(
      secretKeySchema.safeParse("pk_test_51AbCdEfGhIjKlMnOp4f2a").error?.issues[0].message,
    ).toBe("This is a publishable key. Paste a restricted key instead (it starts with rk_).");
  });
});

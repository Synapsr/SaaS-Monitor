import { describe, expect, it } from "vitest";
import { inspectSecretKey } from "./keys";

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

import { describe, expect, it } from "vitest";
import { itemAmount, itemContext } from "@/lib/display/feed";
import { feedItem } from "@/test/display";

describe("feed items", () => {
  it("writes payments as money in, and MRR changes with their sign", () => {
    expect(itemAmount(feedItem({ kind: "payment", amount: 4_999 }), "usd")).toBe("$49.99");
    expect(itemAmount(feedItem({ kind: "churn", amount: -2_900 }), "usd")).toBe("-$29");
    expect(itemAmount(feedItem({ kind: "expansion", amount: 9_900 }), "usd")).toBe("+$99");
  });

  it("says who, what and where, and which account only when several are shown", () => {
    const item = feedItem({ customerName: "Ada", planName: "Pro", country: "FR" });
    expect(itemContext(item, { showAccount: false })).toEqual(["Ada", "Pro", "🇫🇷 France"]);
    expect(
      itemContext({ ...item, customerName: null, country: null }, { showAccount: true }),
    ).toEqual(["Pro", "Acme"]);
  });
});

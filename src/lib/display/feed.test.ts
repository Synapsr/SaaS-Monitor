import { describe, expect, it } from "vitest";
import { itemAmount, itemContext, itemOriginalAmount } from "@/lib/display/feed";
import { recurringMetric } from "@/lib/display/metric";
import { feedItem } from "@/test/display";

const mrr = recurringMetric("mrr");
const arr = recurringMetric("arr");

describe("feed items", () => {
  it("writes payments as money in, and MRR changes with their sign", () => {
    expect(itemAmount(feedItem({ kind: "payment", amount: 4_999 }), "usd", mrr)).toBe("$49.99");
    expect(itemAmount(feedItem({ kind: "churn", amount: -2_900 }), "usd", mrr)).toBe("-$29");
    expect(itemAmount(feedItem({ kind: "expansion", amount: 9_900 }), "usd", mrr)).toBe("+$99");
  });

  it("writes changes as ARR on a screen showing it, and payments as they are", () => {
    expect(itemAmount(feedItem({ kind: "new", amount: 14_900 }), "usd", arr)).toBe("+$1,788");
    expect(itemAmount(feedItem({ kind: "churn", amount: -2_900 }), "usd", arr)).toBe("-$348");
    expect(itemAmount(feedItem({ kind: "payment", amount: 14_900 }), "usd", arr)).toBe("$149");
  });

  it("gives the amount before conversion in the same metric", () => {
    const original = { amount: 4_500, currency: "eur" };
    expect(itemOriginalAmount(feedItem({ original: null }), arr)).toBeNull();
    expect(itemOriginalAmount(feedItem({ kind: "payment", original }), arr)).toBe("€45");
    expect(itemOriginalAmount(feedItem({ kind: "new", original }), mrr)).toBe("€45");
    expect(itemOriginalAmount(feedItem({ kind: "new", original }), arr)).toBe("€540");
  });

  it("says who, what and where, and which account only when several are shown", () => {
    const item = feedItem({ customerName: "Ada", planName: "Pro", country: "FR" });
    expect(itemContext(item, { showAccount: false })).toEqual(["Ada", "Pro", "🇫🇷 France"]);
    expect(
      itemContext({ ...item, customerName: null, country: null }, { showAccount: true }),
    ).toEqual(["Pro", "Acme"]);
  });
});

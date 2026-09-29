import { describe, expect, it } from "vitest";
import {
  itemAmount,
  itemContext,
  itemCountry,
  itemOriginalAmount,
  warningText,
} from "@/lib/display/feed";
import { displayLocale } from "@/lib/display/i18n";
import { recurringMetric } from "@/lib/display/metric";
import { feedItem } from "@/test/display";

const mrr = recurringMetric("mrr");
const arr = recurringMetric("arr");
const US = "en-US";

describe("feed items", () => {
  it("writes payments as money in, and MRR changes with their sign", () => {
    expect(itemAmount(feedItem({ kind: "payment", amount: 4_999 }), "usd", mrr, US)).toBe("$49.99");
    expect(itemAmount(feedItem({ kind: "churn", amount: -2_900 }), "usd", mrr, US)).toBe("-$29");
    expect(itemAmount(feedItem({ kind: "expansion", amount: 9_900 }), "usd", mrr, US)).toBe("+$99");
  });

  it("writes changes as ARR on a screen showing it, and payments as they are", () => {
    expect(itemAmount(feedItem({ kind: "new", amount: 14_900 }), "usd", arr, US)).toBe("+$1,788");
    expect(itemAmount(feedItem({ kind: "churn", amount: -2_900 }), "usd", arr, US)).toBe("-$348");
    expect(itemAmount(feedItem({ kind: "payment", amount: 14_900 }), "usd", arr, US)).toBe("$149");
  });

  it("has no amount for a new customer", () => {
    expect(itemAmount(feedItem({ kind: "customer", amount: 0 }), "usd", mrr, US)).toBeNull();
  });

  it("writes amounts in the screen's locale", () => {
    const payment = feedItem({ kind: "payment", amount: 1_248_050 });
    expect(itemAmount(payment, "eur", mrr, "fr-FR")).toBe("12 480,50 €");
    expect(itemAmount(payment, "eur", mrr, "de-DE")).toBe("12.480,50 €");
  });

  it("gives the amount before conversion in the same metric", () => {
    const original = { amount: 4_500, currency: "eur" };
    expect(itemOriginalAmount(feedItem({ original: null }), arr, US)).toBeNull();
    expect(itemOriginalAmount(feedItem({ kind: "payment", original }), arr, US)).toBe("€45");
    expect(itemOriginalAmount(feedItem({ kind: "new", original }), mrr, US)).toBe("€45");
    expect(itemOriginalAmount(feedItem({ kind: "new", original }), arr, US)).toBe("€540");
  });

  it("says who, what and where, and which account only when several are shown", () => {
    const item = feedItem({ customerName: "Ada", planName: "Pro", country: "FR" });
    expect(itemContext(item, { showAccount: false, language: "en" })).toEqual([
      "Ada",
      "Pro",
      "🇫🇷 France",
    ]);
    expect(
      itemContext(
        { ...item, customerName: null, country: null },
        { showAccount: true, language: "en" },
      ),
    ).toEqual(["Pro", "Acme"]);
  });

  it("names countries in the screen's language", () => {
    expect(itemCountry(feedItem({ country: "DE" }), "fr")).toBe("🇩🇪 Allemagne");
    expect(itemCountry(feedItem({ country: "de" }), "es")).toBe("🇩🇪 Alemania");
    expect(itemCountry(feedItem({ country: null }), "en")).toBeNull();
  });
});

describe("warnings", () => {
  it("are written in the screen's language", () => {
    const { text } = displayLocale("fr");
    expect(warningText({ kind: "unconverted-currency", currency: "jpy" }, text)).toContain(
      "Les montants en JPY",
    );
    expect(
      warningText({ kind: "failing-account", accountName: "Pelli" }, displayLocale("en").text),
    ).toBe("Pelli: this Stripe account needs attention.");
  });
});

import { describe, expect, it } from "vitest";
import {
  countryFlag,
  countryName,
  formatAmount,
  formatPayment,
  formatPercent,
  moneyFlow,
  percentChange,
} from "@/lib/display/format";
import { formatMoney } from "@/lib/money";

describe("countries", () => {
  it("turns ISO codes into flag emoji", () => {
    expect(countryFlag("FR")).toBe("🇫🇷");
    expect(countryFlag("us")).toBe("🇺🇸");
    expect(countryFlag("JP")).toBe("🇯🇵");
  });

  it("ignores missing or malformed codes", () => {
    expect(countryFlag(null)).toBeNull();
    expect(countryFlag("")).toBeNull();
    expect(countryFlag("FRA")).toBeNull();
    expect(countryFlag("1A")).toBeNull();
  });

  it("names countries the same on the server and in any browser, in every language", () => {
    expect(countryName("DE", "en")).toBe("Germany");
    expect(countryName("gb", "en")).toBe("United Kingdom");
    expect(countryName("XK", "en")).toBe("Kosovo");
    expect(countryName("QQ", "en")).toBe("QQ");
    expect(countryName("GB", "fr")).toBe("Royaume-Uni");
    expect(countryName("US", "nl")).toBe("Verenigde Staten");
  });
});

describe("percentages", () => {
  it("compares with the previous value", () => {
    expect(percentChange(110, 100)).toBeCloseTo(0.1);
    expect(percentChange(100, 0)).toBeNull();
  });

  it("keeps one decimal only for small changes", () => {
    expect(formatPercent(0.0987, "en-US", { signed: true })).toBe("+9.9%");
    expect(formatPercent(0.174, "en-US", { signed: true })).toBe("+17%");
    expect(formatPercent(-0.03, "en-US", { signed: true })).toBe("-3%");
    expect(formatPercent(0.58, "en-US")).toBe("58%");
    expect(formatPercent(0.174, "fr-FR", { signed: true })).toBe("+17\u00a0%");
  });
});

describe("amounts", () => {
  it("stay exact below a million and compact above", () => {
    expect(formatAmount(1_468_100, "usd", "en-US")).toBe("$14,681");
    expect(formatAmount(123_456_700, "usd", "en-US")).toBe("$1.2M");
    expect(formatAmount(-35_700, "usd", "en-US", { signed: true })).toBe("-$357");
  });

  it("show the cents of a payment only when there are some", () => {
    expect(formatPayment(4_900, "usd", "en-US")).toBe("$49");
    expect(formatPayment(4_999, "usd", "en-US")).toBe("$49.99");
    expect(formatPayment(4_900, "jpy", "en-US")).toBe("¥4,900");
  });

  it("animate with the exact format of formatMoney", () => {
    for (const [amount, currency, locale] of [
      [1_468_100, "usd", "en-US"],
      [9_876_543, "eur", "en-US"],
      [1_500_000, "jpy", "en-US"],
      [12_345_678, "kwd", "en-US"],
      [9_876_543, "eur", "fr-FR"],
      [9_876_543, "usd", "de-DE"],
    ] as const) {
      const { value, format, locales } = moneyFlow(amount, currency, locale);
      expect(new Intl.NumberFormat(locales, format).format(value)).toBe(
        formatMoney(amount, currency, { locale }),
      );
    }
    const signed = moneyFlow(-40_700, "usd", "en-US", { signed: true });
    expect(new Intl.NumberFormat(signed.locales, signed.format).format(signed.value)).toBe(
      formatMoney(-40_700, "usd", { signed: true }),
    );
  });
});

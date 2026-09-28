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

  it("names countries in English", () => {
    expect(countryName("DE")).toBe("Germany");
    expect(countryName("gb")).toBe("United Kingdom");
  });
});

describe("percentages", () => {
  it("compares with the previous value", () => {
    expect(percentChange(110, 100)).toBeCloseTo(0.1);
    expect(percentChange(100, 0)).toBeNull();
  });

  it("keeps one decimal only for small changes", () => {
    expect(formatPercent(0.0987, { signed: true })).toBe("+9.9%");
    expect(formatPercent(0.174, { signed: true })).toBe("+17%");
    expect(formatPercent(-0.03, { signed: true })).toBe("-3%");
    expect(formatPercent(0.58)).toBe("58%");
  });
});

describe("amounts", () => {
  it("stay exact below a million and compact above", () => {
    expect(formatAmount(1_468_100, "usd")).toBe("$14,681");
    expect(formatAmount(123_456_700, "usd")).toBe("$1.2M");
    expect(formatAmount(-35_700, "usd", { signed: true })).toBe("-$357");
  });

  it("show the cents of a payment only when there are some", () => {
    expect(formatPayment(4_900, "usd")).toBe("$49");
    expect(formatPayment(4_999, "usd")).toBe("$49.99");
    expect(formatPayment(4_900, "jpy")).toBe("¥4,900");
  });

  it("animate with the exact format of formatMoney", () => {
    for (const [amount, currency] of [
      [1_468_100, "usd"],
      [9_876_543, "eur"],
      [1_500_000, "jpy"],
      [12_345_678, "kwd"],
    ] as const) {
      const { value, format, locales } = moneyFlow(amount, currency);
      expect(new Intl.NumberFormat(locales, format).format(value)).toBe(
        formatMoney(amount, currency),
      );
    }
    const signed = moneyFlow(-40_700, "usd", { signed: true });
    expect(new Intl.NumberFormat(signed.locales, signed.format).format(signed.value)).toBe(
      formatMoney(-40_700, "usd", { signed: true }),
    );
  });
});

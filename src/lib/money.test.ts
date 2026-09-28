import { describe, expect, it } from "vitest";
import { convertAmount, formatMoney, minorUnitDigits, toMajorUnits, toMinorUnits } from "./money";

describe("money", () => {
  it("knows the minor unit of each currency", () => {
    expect(minorUnitDigits("usd")).toBe(2);
    expect(minorUnitDigits("JPY")).toBe(0);
    expect(minorUnitDigits("kwd")).toBe(3);
    // Zero-decimal in theory, but represented with two decimals by the Stripe API.
    expect(minorUnitDigits("ugx")).toBe(2);
    expect(minorUnitDigits("isk")).toBe(2);
  });

  it("converts between minor and major units", () => {
    expect(toMajorUnits(12_345, "usd")).toBe(123.45);
    expect(toMajorUnits(500, "jpy")).toBe(500);
    expect(toMinorUnits(1.2345, "kwd")).toBe(1235);
  });

  it("converts amounts between currencies", () => {
    expect(convertAmount(10_000, "eur", "usd", 1.1)).toBe(11_000);
    expect(convertAmount(10_000, "usd", "jpy", 150)).toBe(15_000);
    expect(convertAmount(10_000, "usd", "USD", 2)).toBe(10_000);
  });

  it("formats amounts for a big screen", () => {
    expect(formatMoney(1_248_050, "usd")).toBe("$12,481");
    expect(formatMoney(1_248_050, "usd", { cents: true })).toBe("$12,480.50");
    expect(formatMoney(1_248_050, "usd", { compact: true })).toBe("$12.5K");
    expect(formatMoney(12_000, "usd", { signed: true })).toBe("+$120");
    expect(formatMoney(-12_000, "eur", { signed: true })).toBe("-€120");
    expect(formatMoney(1500, "jpy")).toBe("¥1,500");
  });
});

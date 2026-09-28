import type { Format } from "@number-flow/react";
import { formatMoney, minorUnitDigits, toMajorUnits } from "@/lib/money";

/** How a screen writes amounts, percentages and countries. Dates and times: see `time.ts`. */

const REGIONAL_INDICATOR_A = 0x1f1e6;

/** Flag emoji of an ISO 3166-1 alpha-2 code ("FR" → 🇫🇷), or `null` for anything else. */
export function countryFlag(code: string | null): string | null {
  if (!code || !/^[a-z]{2}$/i.test(code)) return null;
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65),
  );
}

let regionNames: Intl.DisplayNames | undefined;

/** English name of a country code ("DE" → "Germany"), falling back to the code itself. */
export function countryName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Relative change between two values, or `null` when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

/** "+9.9%", "−3%", "+120%": one decimal only when it carries information. */
export function formatPercent(ratio: number, options: { signed?: boolean } = {}): string {
  const percent = ratio * 100;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: Math.abs(percent) < 10 ? 1 : 0,
    signDisplay: options.signed ? "exceptZero" : "auto",
  }).format(ratio);
}

/** Amounts on a wall: exact up to a million, compact beyond (`$1.2M`) so they stay glanceable. */
export function formatAmount(
  amount: number,
  currency: string,
  options: { signed?: boolean; cents?: boolean } = {},
): string {
  const compact = Math.abs(toMajorUnits(amount, currency)) >= 1_000_000;
  return formatMoney(amount, currency, { ...options, compact, cents: options.cents && !compact });
}

/** A payment shows its cents only when it has some: `$49` but `$49.99`. */
export function formatPayment(amount: number, currency: string): string {
  const hasCents = amount % 10 ** minorUnitDigits(currency) !== 0;
  return formatAmount(amount, currency, { cents: hasCents });
}

/**
 * `NumberFlow` props rendering an amount exactly like `formatMoney(amount, currency)`, so the
 * animated hero number and every static amount of the screen share one format.
 */
export function moneyFlow(
  amount: number,
  currency: string,
  options: { signed?: boolean } = {},
): { value: number; format: Format; locales: string } {
  return {
    value: toMajorUnits(amount, currency),
    locales: "en-US",
    format: {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: options.signed ? "exceptZero" : "auto",
    },
  };
}

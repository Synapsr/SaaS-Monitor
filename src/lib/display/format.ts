import type { Format } from "@number-flow/react";
import { COUNTRY_NAMES } from "@/lib/display/countries";
import { formatMoney, minorUnitDigits, toMajorUnits } from "@/lib/money";
import type { Language } from "@/lib/screens/settings";

/**
 * How a screen writes amounts, percentages and countries, in its locale (`DisplayLocale`): "$12,480"
 * in English, "12 480 $US" in French. Dates and times: see `time.ts`.
 */

const REGIONAL_INDICATOR_A = 0x1f1e6;

/** Flag emoji of an ISO 3166-1 alpha-2 code ("FR" → 🇫🇷), or `null` for anything else. */
export function countryFlag(code: string | null): string | null {
  if (!code || !/^[a-z]{2}$/i.test(code)) return null;
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65),
  );
}

/** Name of a country code in `language` ("DE" → "Germany"), falling back to the code itself. */
export function countryName(code: string, language: Language): string {
  const names = COUNTRY_NAMES[language];
  const key = code.toUpperCase();
  return Object.hasOwn(names, key) ? names[key] : code;
}

/** Relative change between two values, or `null` when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

/** "+9.9%", "−3%", "+120%": one decimal only when it carries information. */
export function formatPercent(
  ratio: number,
  locale: string,
  options: { signed?: boolean } = {},
): string {
  const percent = ratio * 100;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: Math.abs(percent) < 10 ? 1 : 0,
    signDisplay: options.signed ? "exceptZero" : "auto",
  }).format(ratio);
}

/** Amounts on a wall: exact up to a million, compact beyond (`$1.2M`) so they stay glanceable. */
export function formatAmount(
  amount: number,
  currency: string,
  locale: string,
  options: { signed?: boolean; cents?: boolean } = {},
): string {
  const compact = Math.abs(toMajorUnits(amount, currency)) >= 1_000_000;
  return formatMoney(amount, currency, {
    ...options,
    locale,
    compact,
    cents: options.cents && !compact,
  });
}

/** A payment shows its cents only when it has some: `$49` but `$49.99`. */
export function formatPayment(amount: number, currency: string, locale: string): string {
  const hasCents = amount % 10 ** minorUnitDigits(currency) !== 0;
  return formatAmount(amount, currency, locale, { cents: hasCents });
}

/**
 * `NumberFlow` props rendering an amount exactly like `formatMoney(amount, currency, { locale })`,
 * so the animated hero number and every static amount of the screen share one format.
 */
export function moneyFlow(
  amount: number,
  currency: string,
  locale: string,
  options: { signed?: boolean } = {},
): { value: number; format: Format; locales: string } {
  return {
    value: toMajorUnits(amount, currency),
    locales: locale,
    format: {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: options.signed ? "exceptZero" : "auto",
    },
  };
}

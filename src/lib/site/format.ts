import { formatMoney } from "@/lib/money";

/**
 * Numbers of the site, written the way its language writes them. The demo's amounts are in US
 * dollars, formatted as screens format them (`14 880 $US` in French, `14.880 $` in German).
 */

/** A count, compact past a thousand: `845`, `1.2K`, `1,2 k`. */
export function formatCount(count: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

/** Dollars of the demo, in major units: `formatDollars(14880, "de-DE")` is `14.880 $`. */
export function formatDollars(
  dollars: number,
  locale: string,
  options: { signed?: boolean; compact?: boolean } = {},
): string {
  return formatMoney(Math.round(dollars * 100), "usd", { locale, ...options });
}

/** A share, from 0 to 1: `+19%`, `+19 %`. */
export function formatPercent(ratio: number, locale: string, options: { signed?: boolean } = {}) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 0,
    signDisplay: options.signed ? "exceptZero" : "auto",
  }).format(ratio);
}

/** A country, by its ISO 3166 code, in a language: `regionName("NL", "de-DE")` is "Niederlande". */
export function regionName(code: string, locale: string): string {
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}

/**
 * A language, named in another one, as it reads within a sentence (`français` in French), or at
 * the start of one (`Français`) with `capitalized`.
 */
export function languageName(
  code: string,
  locale: string,
  { capitalized = false }: { capitalized?: boolean } = {},
): string {
  const name = new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  return capitalized ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) : name;
}

/**
 * Stripe expresses amounts as integers in the currency's minor unit.
 * See https://docs.stripe.com/currencies#zero-decimal. ISK, UGX, HUF and TWD are deliberately
 * absent: for backward compatibility Stripe represents them with two decimals.
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);
const THREE_DECIMAL_CURRENCIES = new Set(["bhd", "jod", "kwd", "omr", "tnd"]);

/** Number of decimal digits of the minor unit (2 for USD cents, 0 for JPY, 3 for KWD). */
export function minorUnitDigits(currency: string): 0 | 2 | 3 {
  const code = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  return 2;
}

export function toMajorUnits(amount: number, currency: string): number {
  return amount / 10 ** minorUnitDigits(currency);
}

export function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * 10 ** minorUnitDigits(currency));
}

/**
 * Converts a minor-unit amount to another currency.
 * `rate` is how many units of `to` one unit of `from` is worth (major units, as FX APIs quote).
 */
export function convertAmount(amount: number, from: string, to: string, rate: number): number {
  if (from.toLowerCase() === to.toLowerCase()) return amount;
  return toMinorUnits(toMajorUnits(amount, from) * rate, to);
}

export interface FormatMoneyOptions {
  /** `$12.5K` instead of `$12,480`. */
  compact?: boolean;
  /** Most decimals of a compact amount: 1 by default (`$1.2M`), more to tell `$1.02M` apart. */
  compactDigits?: number;
  /** Show the minor unit (`$12,480.50`). Off by default: big screens favor round numbers. */
  cents?: boolean;
  /** Always show the sign, e.g. `+$120` for growth. */
  signed?: boolean;
  locale?: string;
}

export function formatMoney(amount: number, currency: string, options: FormatMoneyOptions = {}) {
  const digits = options.cents ? minorUnitDigits(currency) : 0;
  return new Intl.NumberFormat(options.locale ?? "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: options.compact ? "compact" : "standard",
    minimumFractionDigits: options.compact ? 0 : digits,
    maximumFractionDigits: options.compact ? (options.compactDigits ?? 1) : digits,
    signDisplay: options.signed ? "exceptZero" : "auto",
  }).format(toMajorUnits(amount, currency));
}

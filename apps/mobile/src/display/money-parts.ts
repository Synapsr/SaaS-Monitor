import { toMajorUnits } from "@/contract/money";

/** An amount cut around its currency symbol, which the hero sets smaller: "$" "12,480". */
export interface MoneyParts {
  before: string;
  number: string;
  after: string;
}

/**
 * Splits a whole amount like `formatMoney(amount, currency, { locale })` writes it. Where the
 * runtime can't split it, the whole amount is the number.
 */
export function moneyParts(amount: number, currency: string, locale: string): MoneyParts {
  const format = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const value = toMajorUnits(amount, currency);
  try {
    const parts = format.formatToParts(value);
    const isDigits = (part: Intl.NumberFormatPart) =>
      part.type === "integer" || part.type === "group" || part.type === "decimal" || part.type === "fraction";
    const first = parts.findIndex(isDigits);
    const last = parts.findLastIndex(isDigits);
    if (first === -1) throw new Error("No digits");
    const join = (from: number, to: number) =>
      parts
        .slice(from, to)
        .map((part) => part.value)
        .join("");
    return {
      before: join(0, first).trim(),
      number: join(first, last + 1),
      after: join(last + 1, parts.length).trim(),
    };
  } catch {
    return { before: "", number: format.format(value), after: "" };
  }
}

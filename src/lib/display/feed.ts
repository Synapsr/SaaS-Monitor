import { countryFlag, countryName, formatAmount, formatPayment } from "@/lib/display/format";
import type { DisplayText } from "@/lib/display/i18n";
import type { RecurringMetric } from "@/lib/display/metric";
import type { DisplayWarning, FeedItem, FeedItemKind } from "@/lib/display/types";
import type { Language } from "@/lib/screens/settings";

/* How a screen describes feed items, in the feed and in the moments that announce them. */

/** Money in and customers won are good news; downgrades and cancellations are not. */
export function isGoodNews(kind: FeedItemKind): boolean {
  return kind !== "contraction" && kind !== "churn";
}

/**
 * "$49" for a payment, "+$99" or "-$29" for a change of MRR, nothing for a new customer. A screen
 * showing ARR writes changes as ARR ("+$1,188"); a payment is money received, the same in either.
 */
export function itemAmount(
  item: FeedItem,
  currency: string,
  recurring: RecurringMetric,
  locale: string,
): string | null {
  switch (item.kind) {
    case "customer":
      return null;
    case "payment":
      return formatPayment(item.amount, currency, locale);
    default:
      return formatAmount(recurring.fromMrr(item.amount), currency, locale, { signed: true });
  }
}

/** The amount before conversion, in the same metric: "€45" next to "$49". */
export function itemOriginalAmount(
  item: FeedItem,
  recurring: RecurringMetric,
  locale: string,
): string | null {
  if (!item.original) return null;
  const { amount, currency } = item.original;
  const value = item.kind === "payment" ? amount : recurring.fromMrr(amount);
  return formatPayment(value, currency, locale);
}

/** "🇫🇷 France", in the screen's language; `null` for an unknown country. */
export function itemCountry(item: FeedItem, language: Language): string | null {
  if (!item.country) return null;
  return [countryFlag(item.country), countryName(item.country, language)].filter(Boolean).join(" ");
}

/** What a screen may say about an item: customer (when shown), plan, country, account. */
export function itemContext(
  item: FeedItem,
  options: { showAccount: boolean; language: Language },
): string[] {
  return [
    item.customerName,
    item.planName,
    itemCountry(item, options.language),
    options.showAccount ? item.accountName : null,
  ].filter((part): part is string => Boolean(part));
}

/** A warning of the screen, in a sentence. */
export function warningText(warning: DisplayWarning, text: DisplayText): string {
  switch (warning.kind) {
    case "unconverted-currency":
      return text.warnings.unconvertedCurrency(warning.currency.toUpperCase());
    case "failing-account":
      return text.warnings.failingAccount(warning.accountName);
  }
}

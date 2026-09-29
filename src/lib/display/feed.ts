import { countryFlag, countryName, formatAmount, formatPayment } from "@/lib/display/format";
import type { RecurringMetric } from "@/lib/display/metric";
import type { DisplayWarning, FeedItem, FeedItemKind } from "@/lib/display/types";

/* How a screen describes feed items, in the feed and in the moments that announce them. */

export const KIND_LABELS: Record<FeedItemKind, string> = {
  payment: "Payment",
  customer: "New customer",
  new: "New subscription",
  expansion: "Upgrade",
  reactivation: "Reactivation",
  contraction: "Downgrade",
  churn: "Cancellation",
};

/** Money in and customers won are good news; downgrades and cancellations are not. */
export function isGoodNews(kind: FeedItemKind): boolean {
  return kind !== "contraction" && kind !== "churn";
}

/**
 * "$49" for a payment, "+$99" or "-$29" for a change of MRR. A screen showing ARR writes changes
 * as ARR ("+$1,188"); a payment is money received, the same in either.
 */
export function itemAmount(item: FeedItem, currency: string, recurring: RecurringMetric): string {
  return item.kind === "payment"
    ? formatPayment(item.amount, currency)
    : formatAmount(recurring.fromMrr(item.amount), currency, { signed: true });
}

/** The amount before conversion, in the same metric: "€45" next to "$49". */
export function itemOriginalAmount(item: FeedItem, recurring: RecurringMetric): string | null {
  if (!item.original) return null;
  const { amount, currency } = item.original;
  return formatPayment(item.kind === "payment" ? amount : recurring.fromMrr(amount), currency);
}

/** What a screen may say about an item: customer (when shown), plan, country, account. */
export function itemContext(item: FeedItem, options: { showAccount: boolean }): string[] {
  const flag = countryFlag(item.country);
  return [
    item.customerName,
    item.planName,
    item.country ? [flag, countryName(item.country)].filter(Boolean).join(" ") : null,
    options.showAccount ? item.accountName : null,
  ].filter((part): part is string => Boolean(part));
}

/** A warning of the screen, in a sentence. */
export function warningText(warning: DisplayWarning): string {
  switch (warning.kind) {
    case "unconverted-currency":
      return `Amounts in ${warning.currency.toUpperCase()} are left out: no exchange rate is available right now.`;
    case "failing-account":
      return `${warning.accountName}: this Stripe account needs attention.`;
  }
}

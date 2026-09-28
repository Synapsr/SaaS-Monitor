import "server-only";
import type {
  Coupon,
  Discount,
  Price,
  PriceAmounts,
  PriceTier,
  Subscription,
  SubscriptionItem,
  UnixTime,
} from "./types";

/*
 * Monthly recurring revenue as Stripe defines it (https://docs.stripe.com/billing/subscriptions/
 * analytics), so founders see the same number on their wall as in the Stripe Dashboard:
 *
 * - only `active` and `past_due` subscriptions count: trials, `canceled`, `unpaid`, `paused` and
 *   `incomplete` ones do not;
 * - a subscription set to cancel at period end stops counting when the cancellation is requested,
 *   while one with a `cancel_at` date keeps counting until it actually ends;
 * - metered usage and one-time prices are excluded, and taxes are not added (Stripe computes them
 *   on invoices; a tax-inclusive price is counted as is);
 * - `forever` and `repeating` discounts are subtracted, `once` discounts are not;
 * - every item is normalized to a month with its own billing interval.
 *
 * Amounts stay fractional until the very end (a yearly plan divided by 12, a unit price with sub-
 * cent precision): rounding each step would drift, so each subscription is rounded once.
 */

export type BillingInterval = "day" | "week" | "month" | "year";

export interface MrrContext {
  /**
   * Coupons of the discounts, as the catalog found them (see `loadCoupons`). A discount whose
   * coupon is unknown is ignored.
   */
  coupons: ReadonlyMap<string, Coupon>;
  /** When discounts are evaluated: a `repeating` discount only counts until it ends. */
  at: UnixTime;
}

/**
 * Billing periods per month, as a fraction so that integer amounts stay exact: a weekly price is
 * billed 52 times a year, hence 52/12 times a month.
 */
const PERIODS_PER_MONTH: Record<BillingInterval, { numerator: number; denominator: number }> = {
  day: { numerator: 365, denominator: 12 },
  week: { numerator: 52, denominator: 12 },
  month: { numerator: 1, denominator: 1 },
  year: { numerator: 1, denominator: 12 },
};

const CONTRIBUTING_STATUSES = new Set(["active", "past_due"]);

function isBillingInterval(value: string): value is BillingInterval {
  return Object.hasOwn(PERIODS_PER_MONTH, value);
}

/** Whether the subscription counts towards MRR right now. */
export function contributesToMrr(subscription: Subscription): boolean {
  return CONTRIBUTING_STATUSES.has(subscription.status) && !subscription.cancelAtPeriodEnd;
}

/** The subscription's current contribution to MRR, in the minor unit of its currency. */
export function subscriptionMrr(subscription: Subscription, context: MrrContext): number {
  return contributesToMrr(subscription) ? potentialMrr(subscription, context) : 0;
}

/**
 * What the subscription is worth per month while it pays, whatever its status. Used to rebuild the
 * history of subscriptions that already ended.
 */
export function potentialMrr(subscription: Subscription, context: MrrContext): number {
  const { currency } = subscription;
  const itemLines = subscription.items.flatMap((item) => {
    const line = toLine(item, currency);
    // Item discounts apply before subscription discounts.
    return line ? applyDiscounts([line], item.discounts, currency, context) : [];
  });

  // The customer's discount only applies to subscriptions without discounts of their own.
  const customerDiscount = subscription.customer.discount;
  const discounts =
    subscription.discounts.length || !customerDiscount
      ? subscription.discounts
      : [customerDiscount];
  const lines = applyDiscounts(itemLines, discounts, currency, context);

  return Math.round(lines.reduce((total, line) => total + line.monthly, 0));
}

/** Recurring prices billed by quantity: the only ones that count towards MRR. */
export function isLicensedRecurring(price: Price): boolean {
  return price.recurring !== null && price.recurring.usageType !== "metered";
}

/** Names of the recurring products, e.g. `Pro + Extra seats`. */
export function planName(subscription: Subscription): string | null {
  const names = new Set<string>();
  for (const { price } of subscription.items) {
    if (!isLicensedRecurring(price)) continue;
    const name = price.productName ?? price.nickname;
    if (name) names.add(name);
  }
  return names.size ? [...names].join(" + ") : null;
}

/** Billing interval of the item that brings the most revenue. */
export function mainInterval(subscription: Subscription): BillingInterval | null {
  let main: { interval: BillingInterval; monthly: number } | null = null;
  for (const item of subscription.items) {
    const line = toLine(item, subscription.currency);
    if (line && (!main || line.monthly > main.monthly)) {
      main = { interval: line.interval, monthly: line.monthly };
    }
  }
  return main?.interval ?? null;
}

/** An item's monthly amount, as discounts progressively reduce it. */
interface Line {
  productId: string;
  interval: BillingInterval;
  intervalCount: number;
  monthly: number;
}

function toLine(item: SubscriptionItem, currency: string): Line | null {
  const recurring = item.price.recurring;
  if (!recurring || !isLicensedRecurring(item.price) || !isBillingInterval(recurring.interval)) {
    return null;
  }

  const amounts = amountsIn(item, currency);
  if (!amounts) return null;

  return {
    productId: item.price.productId,
    interval: recurring.interval,
    intervalCount: recurring.intervalCount,
    monthly: toMonthly(periodAmount(item, amounts), recurring.interval, recurring.intervalCount),
  };
}

function toMonthly(amount: number, interval: BillingInterval, intervalCount: number): number {
  const { numerator, denominator } = PERIODS_PER_MONTH[interval];
  return (amount * numerator) / (denominator * intervalCount);
}

/** A multi-currency price bills subscriptions in other currencies with its `currency_options`. */
function amountsIn(item: SubscriptionItem, currency: string): PriceAmounts | null {
  const { price } = item;
  if (price.currency === currency) return price.amounts;
  if (!price.currencyOptions) {
    throw new Error(`Price ${price.id} was loaded without its currency options.`);
  }
  // Stripe cannot bill a price in a currency it does not define: nothing to count.
  return price.currencyOptions[currency] ?? null;
}

/** Amount billed for one period of the item, before discounts. */
function periodAmount(item: SubscriptionItem, amounts: PriceAmounts): number {
  const { price } = item;
  const quantity = price.transformQuantity
    ? (price.transformQuantity.round === "up" ? Math.ceil : Math.floor)(
        item.quantity / price.transformQuantity.divideBy,
      )
    : item.quantity;

  if (price.billingScheme !== "tiered") return (amounts.unitAmount ?? 0) * quantity;
  if (!amounts.tiers) throw new Error(`Price ${price.id} was loaded without its tiers.`);
  return price.tiersMode === "volume"
    ? volumeAmount(amounts.tiers, quantity)
    : graduatedAmount(amounts.tiers, quantity);
}

/** Each slice of the quantity is billed at its own tier's price. */
function graduatedAmount(tiers: readonly PriceTier[], quantity: number): number {
  let total = 0;
  let previousUpTo = 0;
  for (const tier of tiers) {
    const upTo = tier.upTo ?? Infinity;
    const units = Math.max(0, Math.min(quantity, upTo) - previousUpTo);
    // A tier's flat fee applies as soon as the quantity reaches the tier (0 is in the first one).
    total += units * tier.unitAmount + tier.flatAmount;
    if (quantity <= upTo) break;
    previousUpTo = upTo;
  }
  return total;
}

/** The whole quantity is billed at the price of the tier it falls in. */
function volumeAmount(tiers: readonly PriceTier[], quantity: number): number {
  const tier = tiers.find((candidate) => candidate.upTo === null || quantity <= candidate.upTo);
  return tier ? quantity * tier.unitAmount + tier.flatAmount : 0;
}

function applyDiscounts(
  lines: Line[],
  discounts: readonly Discount[],
  currency: string,
  context: MrrContext,
): Line[] {
  return discounts.reduce((current, discount) => {
    const coupon = discount.couponId ? context.coupons.get(discount.couponId) : undefined;
    return coupon && isRecurringDiscount(discount, coupon, context.at)
      ? applyCoupon(current, coupon, currency)
      : current;
  }, lines);
}

/** One-time discounts do not change MRR; repeating ones do until they end. */
function isRecurringDiscount(discount: Discount, coupon: Coupon, at: UnixTime): boolean {
  if (coupon.duration === "forever") return true;
  if (coupon.duration === "repeating") return discount.end === null || discount.end > at;
  return false;
}

function applyCoupon(lines: Line[], coupon: Coupon, currency: string): Line[] {
  const applies = (line: Line) =>
    !coupon.appliesToProducts || coupon.appliesToProducts.includes(line.productId);
  const eligible = lines.filter(applies);
  const eligibleTotal = eligible.reduce((total, line) => total + line.monthly, 0);
  if (eligibleTotal <= 0) return lines;

  let remaining: number;
  if (coupon.percentOff !== null) {
    remaining = 1 - coupon.percentOff / 100;
  } else {
    const amountOff = amountOffIn(coupon, currency);
    if (amountOff === null) return lines;
    remaining = 1 - monthlyAmountOff(amountOff, eligible) / eligibleTotal;
  }

  // Scaling the eligible lines spreads an amount off across them, as Stripe does on invoices,
  // and a discount never makes an invoice negative.
  const factor = Math.max(0, remaining);
  return lines.map((line) => (applies(line) ? { ...line, monthly: line.monthly * factor } : line));
}

/** A fixed amount off applies once per invoice, and invoices follow the most frequent interval. */
function monthlyAmountOff(amountOff: number, lines: readonly Line[]): number {
  return Math.max(...lines.map((line) => toMonthly(amountOff, line.interval, line.intervalCount)));
}

/** Stripe only applies an amount off in the invoice currency, possibly via `currency_options`. */
function amountOffIn(coupon: Coupon, currency: string): number | null {
  if (coupon.amountOff === null) return null;
  if (coupon.currency === currency) return coupon.amountOff;
  return coupon.amountOffByCurrency[currency] ?? null;
}

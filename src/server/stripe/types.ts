/**
 * Small views of the Stripe objects the app reads. Only `normalize.ts` knows Stripe's API shapes:
 * the rest of the code depends on these types, so SDK upgrades stay contained.
 *
 * Amounts are in the currency's minor unit, like in Stripe. Unit prices may be fractional
 * (`unit_amount_decimal` allows 12 decimal places), so they are plain numbers.
 */

/** Seconds since the Unix epoch, like every Stripe timestamp. */
export type UnixTime = number;

export interface Subscription {
  id: string;
  customer: Customer;
  /** active, past_due, trialing, canceled, unpaid, paused, incomplete or incomplete_expired. */
  status: string;
  currency: string;
  startDate: UnixTime;
  trialEnd: UnixTime | null;
  endedAt: UnixTime | null;
  /** For `cancel_at_period_end`, the time of the cancellation request, not the period end. */
  canceledAt: UnixTime | null;
  cancelAtPeriodEnd: boolean;
  /** Subscription-level discounts. Each item carries its own. */
  discounts: Discount[];
  items: SubscriptionItem[];
  /** Stripe embeds a limited number of items: the others must be listed separately. */
  hasMoreItems: boolean;
}

export interface Customer {
  id: string;
  /** `null` when unknown, e.g. the customer was deleted or not expanded. */
  name: string | null;
  /** ISO 3166-1 alpha-2 code. */
  country: string | null;
  /** Applies to the customer's subscriptions that have no discount of their own. */
  discount: Discount | null;
}

export interface SubscriptionItem {
  id: string;
  quantity: number;
  currentPeriodStart: UnixTime;
  price: Price;
  discounts: Discount[];
}

export interface Price {
  id: string;
  productId: string;
  /** Known when the product was expanded, otherwise filled from the product catalog. */
  productName: string | null;
  nickname: string | null;
  currency: string;
  recurring: PriceRecurring | null;
  /** `per_unit` or `tiered`. */
  billingScheme: string;
  /** `graduated` or `volume`, for tiered prices. */
  tiersMode: string | null;
  transformQuantity: { divideBy: number; round: string } | null;
  /** Amounts in `currency`. */
  amounts: PriceAmounts;
  /**
   * Amounts in the other currencies of a multi-currency price. `null` when not loaded: Stripe only
   * returns them with `expand: ["currency_options"]`.
   */
  currencyOptions: Record<string, PriceAmounts> | null;
}

export interface PriceRecurring {
  /** `day`, `week`, `month` or `year`. */
  interval: string;
  intervalCount: number;
  /** `licensed` (billed by quantity) or `metered` (billed by usage). */
  usageType: string;
}

export interface PriceAmounts {
  /** Per-unit amount, for `per_unit` prices. */
  unitAmount: number | null;
  /** `null` when not loaded: Stripe only returns tiers with `expand: ["tiers"]`. */
  tiers: PriceTier[] | null;
}

export interface PriceTier {
  /** Inclusive upper bound of the tier; `null` for the last one. */
  upTo: number | null;
  unitAmount: number;
  flatAmount: number;
}

export interface Discount {
  id: string;
  couponId: string | null;
  /** When a `repeating` discount stops applying. */
  end: UnixTime | null;
}

export interface Coupon {
  id: string;
  percentOff: number | null;
  /** In the minor unit of `currency`. */
  amountOff: number | null;
  currency: string | null;
  /** `amount_off` in other currencies, keyed by lowercase ISO code. */
  amountOffByCurrency: Record<string, number>;
  /** `forever`, `once` or `repeating`. */
  duration: string;
  /** Products the coupon is restricted to; `null` when it applies to every product. */
  appliesToProducts: string[] | null;
}

export interface Charge {
  id: string;
  customerId: string | null;
  /** Amount actually collected (captured). */
  amount: number;
  amountRefunded: number;
  currency: string;
  created: UnixTime;
  /** The charge succeeded and was captured: money was collected. */
  collected: boolean;
  description: string | null;
  customerName: string | null;
  country: string | null;
}

export interface Product {
  id: string;
  name: string;
}

export interface AccountInfo {
  /** `acct_…` identifier. */
  id: string;
  /** Name shown in the Stripe Dashboard, when set. */
  name: string | null;
  defaultCurrency: string | null;
}

/**
 * An event as listed by the Events API. `object` is rendered with the API version the account
 * used when the event happened, so it is parsed defensively (see `readEventSignal`).
 */
export interface StripeEvent {
  id: string;
  type: string;
  created: UnixTime;
  object: unknown;
}

/** What an event tells the sync engine, see `readEventSignal`. */
export type EventSignal =
  | { kind: "subscription"; subscriptionId: string }
  | { kind: "discount"; subscriptionId: string | null; customerId: string | null }
  | { kind: "charge"; charge: Charge };

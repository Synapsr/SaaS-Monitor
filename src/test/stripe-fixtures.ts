import {
  couponSchema,
  type ChargeInput,
  type CouponInput,
  type PriceInput,
  type SubscriptionInput,
  type SubscriptionItemInput,
} from "@/server/stripe/normalize";
import type { Coupon } from "@/server/stripe/types";

/*
 * Builders of Stripe-shaped objects with only the fields the app reads. Tests pass them through
 * the real normalisation (directly or via the fake gateway), like objects coming from Stripe.
 */

let lastId = 0;

/** Unique, readable ids such as `sub_7`. */
export function stripeId(prefix: string): string {
  lastId += 1;
  return `${prefix}_${lastId}`;
}

/** 2026-01-01T00:00:00Z, a convenient origin for Stripe timestamps in tests. */
export const JANUARY_1 = Date.UTC(2026, 0, 1) / 1000;

export function stripePrice(overrides: Partial<PriceInput> = {}): PriceInput {
  return {
    id: stripeId("price"),
    product: "prod_pro",
    nickname: null,
    currency: "usd",
    recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
    billing_scheme: "per_unit",
    unit_amount: 2000,
    unit_amount_decimal: "2000",
    ...overrides,
  };
}

/** A price with a unit amount, e.g. `monthlyPrice(4900)` for $49/month. */
export function monthlyPrice(unitAmount: number, overrides: Partial<PriceInput> = {}) {
  return stripePrice({
    unit_amount: unitAmount,
    unit_amount_decimal: String(unitAmount),
    ...overrides,
  });
}

export function stripeItem(overrides: Partial<SubscriptionItemInput> = {}): SubscriptionItemInput {
  return {
    id: stripeId("si"),
    quantity: 1,
    current_period_start: JANUARY_1,
    price: stripePrice(),
    discounts: [],
    ...overrides,
  };
}

export type SubscriptionFixture = Omit<Partial<SubscriptionInput>, "items"> & {
  items?: SubscriptionItemInput[];
  hasMoreItems?: boolean;
};

export function stripeSubscription(fixture: SubscriptionFixture = {}): SubscriptionInput {
  const { items = [stripeItem()], hasMoreItems = false, ...overrides } = fixture;
  return {
    id: stripeId("sub"),
    customer: stripeCustomer(),
    status: "active",
    currency: "usd",
    start_date: JANUARY_1,
    trial_end: null,
    ended_at: null,
    canceled_at: null,
    cancel_at_period_end: false,
    discounts: [],
    items: { data: items, has_more: hasMoreItems },
    ...overrides,
  };
}

export function stripeCustomer(
  overrides: {
    id?: string;
    name?: string | null;
    country?: string | null;
    discount?: ReturnType<typeof stripeDiscount> | null;
  } = {},
) {
  return {
    id: overrides.id ?? stripeId("cus"),
    name: overrides.name === undefined ? "Ada Lovelace" : overrides.name,
    address: { country: overrides.country === undefined ? "FR" : overrides.country },
    discount: overrides.discount ?? null,
  };
}

export function stripeCoupon(overrides: Partial<CouponInput> = {}): CouponInput {
  return {
    id: stripeId("coupon"),
    percent_off: null,
    amount_off: null,
    currency: null,
    duration: "forever",
    ...overrides,
  };
}

/** Coupons keyed by id, as the catalog hands them to the MRR computation. */
export function couponMap(coupons: readonly CouponInput[]): Map<string, Coupon> {
  return new Map(
    coupons.map((input) => {
      const coupon = couponSchema.parse(input);
      return [coupon.id, coupon];
    }),
  );
}

/** A discount redeeming `coupon`, as attached to a subscription, an item or a customer. */
export function stripeDiscount(coupon: { id: string }, overrides: { end?: number | null } = {}) {
  return { id: stripeId("di"), end: overrides.end ?? null, source: { coupon: coupon.id } };
}

export function stripeCharge(overrides: Partial<ChargeInput> = {}): ChargeInput {
  const amount = overrides.amount ?? 4900;
  return {
    id: stripeId("ch"),
    amount,
    amount_captured: amount,
    amount_refunded: 0,
    captured: true,
    currency: "usd",
    created: JANUARY_1,
    status: "succeeded",
    customer: null,
    description: "Subscription update",
    billing_details: { name: "Ada Lovelace", address: { country: "FR" } },
    payment_method_details: { card: { country: "FR" } },
    ...overrides,
  };
}

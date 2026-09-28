import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  couponMap,
  DAY,
  JANUARY_1,
  monthlyPrice,
  stripeCoupon,
  stripeCustomer,
  stripeDiscount,
  stripeItem,
  stripePrice,
  stripeSubscription,
  type SubscriptionFixture,
} from "@/test/stripe-fixtures";
import { mainInterval, planName, potentialMrr, subscriptionMrr } from "./mrr";
import { subscriptionSchema, type CouponInput, type PriceInput } from "./normalize";

function evaluate(fixture: SubscriptionFixture, coupons: CouponInput[] = [], at = JANUARY_1) {
  const subscription = subscriptionSchema.parse(stripeSubscription(fixture));
  const context = { coupons: couponMap(coupons), at };
  return {
    mrr: subscriptionMrr(subscription, context),
    potential: potentialMrr(subscription, context),
  };
}

const mrrOf = (fixture: SubscriptionFixture, coupons: CouponInput[] = [], at = JANUARY_1) =>
  evaluate(fixture, coupons, at).mrr;

/** A subscription with a single item. */
const withPrice = (price: PriceInput, quantity = 1): SubscriptionFixture => ({
  items: [stripeItem({ price, quantity })],
});

const recurring = (interval: string, intervalCount = 1) => ({
  recurring: { interval, interval_count: intervalCount, usage_type: "licensed" },
});

describe("MRR of a subscription", () => {
  describe("billing intervals", () => {
    it("counts a monthly price as is", () => {
      expect(mrrOf(withPrice(monthlyPrice(4900)))).toBe(4900);
    });

    it("divides yearly prices by 12 and rounds once", () => {
      expect(mrrOf(withPrice(monthlyPrice(12_000, recurring("year"))))).toBe(1000);
      expect(mrrOf(withPrice(monthlyPrice(10_000, recurring("year"))))).toBe(833);
    });

    it("spreads multi-period intervals over their length", () => {
      expect(mrrOf(withPrice(monthlyPrice(9000, recurring("month", 3))))).toBe(3000);
      expect(mrrOf(withPrice(monthlyPrice(24_000, recurring("year", 2))))).toBe(1000);
      expect(mrrOf(withPrice(monthlyPrice(1000, recurring("week", 2))))).toBe(2167);
    });

    it("counts 52 weeks and 365 days a year", () => {
      expect(mrrOf(withPrice(monthlyPrice(1000, recurring("week"))))).toBe(4333);
      expect(mrrOf(withPrice(monthlyPrice(100, recurring("day"))))).toBe(3042);
    });

    it("normalises each item with its own interval", () => {
      const items = [
        stripeItem({ price: monthlyPrice(1000) }),
        stripeItem({ price: monthlyPrice(12_000, recurring("year")) }),
      ];
      expect(mrrOf({ items })).toBe(2000);
    });

    it("keeps zero-decimal currencies in their own unit", () => {
      const price = monthlyPrice(10_000, { currency: "jpy", ...recurring("year") });
      expect(mrrOf({ currency: "jpy", items: [stripeItem({ price })] })).toBe(833);
    });
  });

  describe("per-unit amounts", () => {
    it("multiplies by the quantity", () => {
      expect(mrrOf(withPrice(monthlyPrice(1500), 3))).toBe(4500);
      expect(mrrOf(withPrice(monthlyPrice(1500), 0))).toBe(0);
    });

    it("uses the decimal amount for sub-cent precision", () => {
      const price = stripePrice({ unit_amount: 1235, unit_amount_decimal: "1234.5678" });
      expect(mrrOf(withPrice(price, 10))).toBe(12_346);
    });

    it("accepts the SDK's Decimal objects as well as strings", () => {
      const price = stripePrice({
        unit_amount: 100,
        unit_amount_decimal: Stripe.Decimal.from("99.5"),
      });
      expect(mrrOf(withPrice(price, 3))).toBe(299);
    });

    it("falls back to the integer amount when the decimal one is missing", () => {
      const price = stripePrice({ unit_amount: 700, unit_amount_decimal: null });
      expect(mrrOf(withPrice(price))).toBe(700);
    });

    it("applies transform_quantity before pricing", () => {
      const packs = (round: string) =>
        monthlyPrice(1000, { transform_quantity: { divide_by: 10, round } });
      expect(mrrOf(withPrice(packs("up"), 11))).toBe(2000);
      expect(mrrOf(withPrice(packs("down"), 11))).toBe(1000);
    });
  });

  describe("tiered prices", () => {
    const tiers = [
      { up_to: 5, unit_amount: 1000, unit_amount_decimal: "1000", flat_amount: null },
      { up_to: null, unit_amount: 500, unit_amount_decimal: "500", flat_amount: 2000 },
    ];
    const tiered = (mode: string, tierList: PriceInput["tiers"] = tiers) =>
      stripePrice({
        billing_scheme: "tiered",
        tiers_mode: mode,
        tiers: tierList,
        unit_amount: null,
        unit_amount_decimal: null,
      });

    it("bills each slice at its tier's price with graduated tiers", () => {
      expect(mrrOf(withPrice(tiered("graduated"), 3))).toBe(3000);
      // 5 × $10, then 3 × $5 plus the second tier's flat fee.
      expect(mrrOf(withPrice(tiered("graduated"), 8))).toBe(5000 + 1500 + 2000);
    });

    it("bills the whole quantity at one tier with volume tiers", () => {
      expect(mrrOf(withPrice(tiered("volume"), 5))).toBe(5000);
      expect(mrrOf(withPrice(tiered("volume"), 8))).toBe(4000 + 2000);
    });

    it("charges the first tier's flat fee for a zero quantity", () => {
      const base = [{ up_to: null, unit_amount: 300, flat_amount: 9900 }];
      expect(mrrOf(withPrice(tiered("graduated", base), 0))).toBe(9900);
      expect(mrrOf(withPrice(tiered("volume", base), 0))).toBe(9900);
    });

    it("reads decimal tier amounts", () => {
      const precise = [
        {
          up_to: null,
          unit_amount_decimal: "0.5",
          flat_amount: 100,
          flat_amount_decimal: "100.25",
        },
      ];
      expect(mrrOf(withPrice(tiered("graduated", precise), 3))).toBe(102);
    });

    it("refuses to guess when the tiers were not loaded", () => {
      const price = stripePrice({ billing_scheme: "tiered", tiers_mode: "volume" });
      expect(() => mrrOf(withPrice(price))).toThrow("without its tiers");
    });
  });

  describe("excluded revenue", () => {
    it("ignores metered usage", () => {
      const metered = stripePrice({
        recurring: { interval: "month", interval_count: 1, usage_type: "metered" },
      });
      const items = [stripeItem({ price: monthlyPrice(2900) }), stripeItem({ price: metered })];
      expect(mrrOf({ items })).toBe(2900);
    });

    it("ignores one-time prices", () => {
      const setupFee = stripePrice({ recurring: null, unit_amount_decimal: "10000" });
      const items = [stripeItem({ price: monthlyPrice(2900) }), stripeItem({ price: setupFee })];
      expect(mrrOf({ items })).toBe(2900);
    });

    it("counts free plans as zero", () => {
      expect(mrrOf(withPrice(monthlyPrice(0)))).toBe(0);
    });
  });

  describe("statuses", () => {
    it.each(["active", "past_due"])("counts %s subscriptions", (status) => {
      expect(evaluate({ status, ...withPrice(monthlyPrice(4900)) }).mrr).toBe(4900);
    });

    it.each(["trialing", "canceled", "unpaid", "paused", "incomplete", "incomplete_expired"])(
      "excludes %s subscriptions but knows what they are worth",
      (status) => {
        expect(evaluate({ status, ...withPrice(monthlyPrice(4900)) })).toEqual({
          mrr: 0,
          potential: 4900,
        });
      },
    );

    it("stops counting when a cancellation at period end is requested", () => {
      const fixture = { cancel_at_period_end: true, ...withPrice(monthlyPrice(4900)) };
      expect(evaluate(fixture)).toEqual({ mrr: 0, potential: 4900 });
    });

    it("keeps counting a subscription scheduled to cancel at a date", () => {
      const subscription = subscriptionSchema.parse({
        ...stripeSubscription(withPrice(monthlyPrice(4900))),
        cancel_at: JANUARY_1 + 30 * DAY,
      });
      expect(subscriptionMrr(subscription, { coupons: new Map(), at: JANUARY_1 })).toBe(4900);
    });
  });

  describe("discounts", () => {
    const percent = (percentOff: number, overrides: Partial<CouponInput> = {}) =>
      stripeCoupon({ percent_off: percentOff, ...overrides });
    const amount = (amountOff: number, overrides: Partial<CouponInput> = {}) =>
      stripeCoupon({ amount_off: amountOff, currency: "usd", ...overrides });

    it("subtracts forever discounts", () => {
      const coupon = percent(20);
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(mrrOf(fixture, [coupon])).toBe(4000);
    });

    it("subtracts repeating discounts until they end", () => {
      const coupon = percent(50, { duration: "repeating" });
      const fixture = {
        discounts: [stripeDiscount(coupon, { end: JANUARY_1 + 90 * DAY })],
        ...withPrice(monthlyPrice(5000)),
      };
      expect(mrrOf(fixture, [coupon], JANUARY_1)).toBe(2500);
      expect(mrrOf(fixture, [coupon], JANUARY_1 + 90 * DAY)).toBe(5000);
    });

    it("ignores one-time discounts", () => {
      const coupon = percent(50, { duration: "once" });
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(mrrOf(fixture, [coupon])).toBe(5000);
    });

    it("makes a fully discounted subscription worth nothing", () => {
      const coupon = percent(100);
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(evaluate(fixture, [coupon])).toEqual({ mrr: 0, potential: 0 });
    });

    it("spreads an amount off per invoice over the billing interval", () => {
      const coupon = amount(1200);
      const monthly = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      const yearly = {
        discounts: [stripeDiscount(coupon)],
        ...withPrice(monthlyPrice(60_000, recurring("year"))),
      };
      expect(mrrOf(monthly, [coupon])).toBe(3800);
      expect(mrrOf(yearly, [coupon])).toBe(4900);
    });

    it("never goes below zero", () => {
      const coupon = amount(10_000);
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(mrrOf(fixture, [coupon])).toBe(0);
    });

    it("uses the amount off defined for the subscription's currency", () => {
      const coupon = amount(1000, {
        currency: "eur",
        currency_options: { usd: { amount_off: 1100 } },
      });
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(mrrOf(fixture, [coupon])).toBe(3900);
    });

    it("ignores an amount off without an amount in the subscription's currency", () => {
      const coupon = amount(1000, { currency: "eur" });
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(mrrOf(fixture, [coupon])).toBe(5000);
    });

    it("applies item discounts before subscription discounts", () => {
      const half = percent(50);
      const tenPercent = percent(10);
      const items = [
        stripeItem({ price: monthlyPrice(10_000), discounts: [stripeDiscount(half)] }),
        stripeItem({ price: monthlyPrice(5000, { product: "prod_addon" }) }),
      ];
      const fixture = { items, discounts: [stripeDiscount(tenPercent)] };
      expect(mrrOf(fixture, [half, tenPercent])).toBe(9000);
    });

    it("stacks subscription discounts in order", () => {
      const first = percent(10);
      const second = amount(1000);
      const fixture = {
        discounts: [stripeDiscount(first), stripeDiscount(second)],
        ...withPrice(monthlyPrice(10_000)),
      };
      expect(mrrOf(fixture, [first, second])).toBe(8000);
    });

    it("only discounts the products a coupon applies to", () => {
      const coupon = percent(50, { applies_to: { products: ["prod_pro"] } });
      const fixed = amount(1000, { applies_to: { products: ["prod_addon"] } });
      const items = [
        stripeItem({ price: monthlyPrice(10_000, { product: "prod_pro" }) }),
        stripeItem({ price: monthlyPrice(2000, { product: "prod_addon" }) }),
      ];
      expect(mrrOf({ items, discounts: [stripeDiscount(coupon)] }, [coupon])).toBe(7000);
      expect(mrrOf({ items, discounts: [stripeDiscount(fixed)] }, [fixed])).toBe(11_000);
    });

    it("ignores a coupon restricted to other products", () => {
      const coupon = percent(50, { applies_to: { products: ["prod_other"] } });
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(mrrOf(fixture, [coupon])).toBe(5000);
    });

    it("applies the customer's discount to subscriptions without their own", () => {
      const customerCoupon = percent(25);
      const subscriptionCoupon = percent(10);
      const customer = stripeCustomer({ discount: stripeDiscount(customerCoupon) });
      const coupons = [customerCoupon, subscriptionCoupon];
      expect(mrrOf({ customer, ...withPrice(monthlyPrice(4000)) }, coupons)).toBe(3000);
      expect(
        mrrOf(
          {
            customer,
            discounts: [stripeDiscount(subscriptionCoupon)],
            ...withPrice(monthlyPrice(4000)),
          },
          coupons,
        ),
      ).toBe(3600);
    });

    it("ignores discounts whose coupon is unknown", () => {
      const coupon = percent(50);
      const fixture = { discounts: [stripeDiscount(coupon)], ...withPrice(monthlyPrice(5000)) };
      expect(mrrOf(fixture, [])).toBe(5000);
    });
  });

  describe("multi-currency prices", () => {
    it("bills in the subscription's currency from the price's currency options", () => {
      const price = monthlyPrice(2000, {
        currency_options: { eur: { unit_amount: 1800, unit_amount_decimal: "1800" } },
      });
      expect(mrrOf({ currency: "eur", items: [stripeItem({ price })] })).toBe(1800);
    });

    it("uses tiers of the subscription's currency", () => {
      const price = stripePrice({
        billing_scheme: "tiered",
        tiers_mode: "volume",
        tiers: [{ up_to: null, unit_amount: 1000 }],
        currency_options: { eur: { tiers: [{ up_to: null, unit_amount: 900 }] } },
      });
      expect(mrrOf({ currency: "eur", items: [stripeItem({ price, quantity: 2 })] })).toBe(1800);
    });

    it("refuses to guess when the currency options were not loaded", () => {
      expect(() =>
        mrrOf({ currency: "eur", items: [stripeItem({ price: monthlyPrice(2000) })] }),
      ).toThrow("without its currency options");
    });
  });
});

describe("plan name", () => {
  it("joins the names of the recurring products", () => {
    const items = [
      stripeItem({ price: monthlyPrice(4900, { product: { id: "prod_pro", name: "Pro" } }) }),
      stripeItem({
        price: monthlyPrice(900, { product: { id: "prod_seat", name: "Extra seats" } }),
      }),
      stripeItem({
        price: monthlyPrice(900, { product: { id: "prod_seat", name: "Extra seats" } }),
      }),
    ];
    expect(planName(subscriptionSchema.parse(stripeSubscription({ items })))).toBe(
      "Pro + Extra seats",
    );
  });

  it("falls back to the price nickname and skips metered items", () => {
    const metered = stripePrice({
      product: { id: "prod_api", name: "API calls" },
      recurring: { interval: "month", interval_count: 1, usage_type: "metered" },
    });
    const items = [
      stripeItem({ price: monthlyPrice(4900, { nickname: "Starter" }) }),
      stripeItem({ price: metered }),
    ];
    expect(planName(subscriptionSchema.parse(stripeSubscription({ items })))).toBe("Starter");
  });
});

describe("main billing interval", () => {
  it("is the interval of the item bringing the most revenue", () => {
    const items = [
      stripeItem({ price: monthlyPrice(1000) }),
      stripeItem({ price: monthlyPrice(60_000, recurring("year")) }),
    ];
    expect(mainInterval(subscriptionSchema.parse(stripeSubscription({ items })))).toBe("year");
  });

  it("is null without recurring items", () => {
    const items = [stripeItem({ price: stripePrice({ recurring: null }) })];
    expect(mainInterval(subscriptionSchema.parse(stripeSubscription({ items })))).toBeNull();
  });
});

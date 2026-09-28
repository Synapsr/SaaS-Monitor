import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  JANUARY_1,
  stripeCharge,
  stripeCoupon,
  stripeItem,
  stripePrice,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import {
  chargeSchema,
  couponSchema,
  parseDecimal,
  priceSchema,
  readEventSignal,
  subscriptionSchema,
} from "./normalize";

describe("decimal amounts", () => {
  it("reads strings, numbers and the SDK's Decimal objects", () => {
    expect(parseDecimal("1234.5678")).toBe(1234.5678);
    expect(parseDecimal(" 12 ")).toBe(12);
    expect(parseDecimal(99)).toBe(99);
    expect(parseDecimal(Stripe.Decimal.from("0.000000000001"))).toBe(1e-12);
  });

  it("rejects anything else", () => {
    for (const value of ["", "abc", null, undefined, {}, Number.NaN, true]) {
      expect(parseDecimal(value)).toBeNull();
    }
  });
});

describe("subscription normalization", () => {
  it("keeps what the app needs from an expanded subscription", () => {
    const subscription = subscriptionSchema.parse(
      stripeSubscription({
        id: "sub_1",
        customer: { id: "cus_1", name: null, business_name: "Acme Inc", address: null },
        status: "past_due",
        trial_end: JANUARY_1,
        items: [stripeItem({ id: "si_1", quantity: 2 })],
        hasMoreItems: true,
      }),
    );
    expect(subscription).toMatchObject({
      id: "sub_1",
      customer: { id: "cus_1", name: "Acme Inc", country: null, discount: null },
      status: "past_due",
      trialEnd: JANUARY_1,
      endedAt: null,
      hasMoreItems: true,
      items: [{ id: "si_1", quantity: 2, currentPeriodStart: JANUARY_1 }],
    });
  });

  it("accepts a customer that was not expanded", () => {
    const subscription = subscriptionSchema.parse(stripeSubscription({ customer: "cus_2" }));
    expect(subscription.customer).toEqual({
      id: "cus_2",
      name: null,
      country: null,
      discount: null,
    });
  });

  it("reads the coupon a discount embeds, and only the id of a deleted one", () => {
    const coupon = stripeCoupon({ id: "coupon_1", percent_off: 20 });
    const discounts = [
      { id: "di_1", source: { coupon: "coupon_1" } },
      { id: "di_2", source: { coupon } },
      { id: "di_3", source: { coupon: { id: "coupon_2", object: "coupon", deleted: true } } },
      { id: "di_4", source: { coupon: null } },
    ];
    const subscription = subscriptionSchema.parse(stripeSubscription({ discounts }));
    expect(subscription.discounts).toEqual([
      { id: "di_1", couponId: "coupon_1", embeddedCoupon: null, end: null },
      {
        id: "di_2",
        couponId: "coupon_1",
        embeddedCoupon: expect.objectContaining({ id: "coupon_1", percentOff: 20 }),
        end: null,
      },
      { id: "di_3", couponId: "coupon_2", embeddedCoupon: null, end: null },
      { id: "di_4", couponId: null, embeddedCoupon: null, end: null },
    ]);
  });

  it("counts metered items without quantity as one", () => {
    const item = stripeItem();
    delete item.quantity;
    const subscription = subscriptionSchema.parse(stripeSubscription({ items: [item] }));
    expect(subscription.items[0].quantity).toBe(1);
  });
});

describe("price normalization", () => {
  it("reads expanded products, tiers and currency options", () => {
    const price = priceSchema.parse(
      stripePrice({
        product: { id: "prod_1", name: "Pro" },
        billing_scheme: "tiered",
        tiers_mode: "graduated",
        tiers: [
          { up_to: 10, unit_amount: 100, unit_amount_decimal: Stripe.Decimal.from("99.5") },
          { up_to: null, unit_amount: 50, flat_amount: 1000 },
        ],
        currency_options: { EUR: { unit_amount: null, unit_amount_decimal: "90.25" } },
      }),
    );
    expect(price).toMatchObject({
      productId: "prod_1",
      productName: "Pro",
      amounts: {
        tiers: [
          { upTo: 10, unitAmount: 99.5, flatAmount: 0 },
          { upTo: null, unitAmount: 50, flatAmount: 1000 },
        ],
      },
      currencyOptions: { eur: { unitAmount: 90.25, tiers: null } },
    });
  });

  it("knows when tiers and currency options were not loaded", () => {
    const price = priceSchema.parse(stripePrice({ product: { id: "prod_1", deleted: true } }));
    expect(price).toMatchObject({
      productName: null,
      currencyOptions: null,
      amounts: { tiers: null },
    });
  });
});

describe("coupon normalization", () => {
  it("treats an empty product restriction as none", () => {
    expect(
      couponSchema.parse(stripeCoupon({ applies_to: { products: [] } })).appliesToProducts,
    ).toBeNull();
    expect(
      couponSchema.parse(stripeCoupon({ applies_to: { products: ["prod_1"] } })).appliesToProducts,
    ).toEqual(["prod_1"]);
  });

  it("indexes amounts off by lowercase currency", () => {
    const coupon = couponSchema.parse(
      stripeCoupon({
        amount_off: 500,
        currency: "USD",
        currency_options: { EUR: { amount_off: 450 } },
      }),
    );
    expect(coupon).toMatchObject({
      currency: "usd",
      amountOff: 500,
      amountOffByCurrency: { eur: 450 },
    });
  });
});

describe("charge normalization", () => {
  it("keeps the captured amount and refunds", () => {
    const charge = chargeSchema.parse(
      stripeCharge({ amount: 5000, amount_captured: 3000, amount_refunded: 1000, currency: "EUR" }),
    );
    expect(charge).toMatchObject({
      amount: 3000,
      amountRefunded: 1000,
      currency: "eur",
      collected: true,
    });
  });

  it("only counts succeeded and captured charges as collected", () => {
    expect(chargeSchema.parse(stripeCharge({ status: "failed" })).collected).toBe(false);
    expect(chargeSchema.parse(stripeCharge({ status: "pending" })).collected).toBe(false);
    expect(
      chargeSchema.parse(stripeCharge({ captured: false, amount_captured: 0 })).collected,
    ).toBe(false);
  });

  it("reads payloads rendered with old API versions", () => {
    const legacy = stripeCharge({ amount: 2500, customer: { id: "cus_1" }, description: "" });
    delete legacy.amount_captured;
    delete legacy.captured;
    expect(chargeSchema.parse(legacy)).toMatchObject({
      amount: 2500,
      collected: true,
      customerId: "cus_1",
      description: null,
    });
  });

  it("finds the country on the card when the billing address has none", () => {
    const charge = chargeSchema.parse(
      stripeCharge({
        billing_details: { name: null, address: { country: null } },
        payment_method_details: { card: { country: "DE" } },
      }),
    );
    expect(charge).toMatchObject({ customerName: null, country: "DE" });
  });
});

describe("event signals", () => {
  const event = (type: string, object: unknown) => ({
    id: "evt_1",
    type,
    created: JANUARY_1,
    object,
  });

  it("turns subscription events into a subscription to refresh", () => {
    expect(readEventSignal(event("customer.subscription.updated", { id: "sub_1" }))).toEqual({
      kind: "subscription",
      subscriptionId: "sub_1",
    });
  });

  it("points discount events at their subscription or customer", () => {
    expect(
      readEventSignal(
        event("customer.discount.created", { subscription: "sub_1", customer: "cus_1" }),
      ),
    ).toEqual({ kind: "discount", subscriptionId: "sub_1", customerId: "cus_1" });
    expect(
      readEventSignal(
        event("customer.discount.deleted", { subscription: null, customer: { id: "cus_1" } }),
      ),
    ).toEqual({ kind: "discount", subscriptionId: null, customerId: "cus_1" });
  });

  it("reads charges from their payload", () => {
    const signal = readEventSignal(
      event("charge.refunded", stripeCharge({ id: "ch_1", amount_refunded: 100 })),
    );
    expect(signal).toMatchObject({ kind: "charge", charge: { id: "ch_1", amountRefunded: 100 } });
  });

  it("ignores unknown events and malformed payloads", () => {
    expect(readEventSignal(event("invoice.paid", { id: "in_1" }))).toBeNull();
    expect(
      readEventSignal(event("customer.subscription.updated", { object: "subscription" })),
    ).toBeNull();
    expect(readEventSignal(event("charge.succeeded", { id: "ch_1" }))).toBeNull();
  });
});

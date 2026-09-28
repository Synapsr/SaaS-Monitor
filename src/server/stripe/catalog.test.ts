import { describe, expect, it } from "vitest";
import { FakeStripe } from "@/test/fake-stripe";
import {
  monthlyPrice,
  stripeCoupon,
  stripeDiscount,
  stripeItem,
  stripePrice,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import { createCatalog } from "./catalog";
import { subscriptionMrr } from "./mrr";

const tieredPrice = stripePrice({
  id: "price_tiered",
  billing_scheme: "tiered",
  tiers_mode: "volume",
  unit_amount: null,
  unit_amount_decimal: null,
  tiers: [{ up_to: null, unit_amount: 700 }],
});

describe("catalog", () => {
  it("lists the items Stripe leaves out of a subscription", async () => {
    const stripe = new FakeStripe();
    stripe.embeddedItems = 1;
    stripe.putSubscription(
      stripeSubscription({
        id: "sub_1",
        items: [1000, 2000, 3000].map((amount) => stripeItem({ price: monthlyPrice(amount) })),
      }),
    );
    const catalog = createCatalog(stripe, { bulk: false });

    const listed = (await stripe.listSubscriptions()).data;
    expect(listed[0]).toMatchObject({ hasMoreItems: true, items: [{}] });
    const [subscription] = await catalog.complete(listed);

    expect(subscription).toMatchObject({ hasMoreItems: false });
    expect(subscriptionMrr(subscription, { coupons: catalog.coupons, at: 0 })).toBe(6000);
  });

  it("only asks for price details when the MRR depends on them, once per price", async () => {
    const stripe = new FakeStripe();
    for (const id of ["sub_1", "sub_2"]) {
      stripe.putSubscription(
        stripeSubscription({
          id,
          items: [stripeItem({ price: monthlyPrice(1000) }), stripeItem({ price: tieredPrice })],
        }),
      );
    }
    const catalog = createCatalog(stripe, { bulk: true });
    const listed = (await stripe.listSubscriptions()).data;
    const requestsBefore = stripe.requestCount;

    const completed = await catalog.complete(listed);

    // One request for the tiers; the product names come from one listing of the catalog.
    expect(stripe.requestCount - requestsBefore).toBe(2);
    expect(
      completed.map((subscription) =>
        subscriptionMrr(subscription, { coupons: catalog.coupons, at: 0 }),
      ),
    ).toEqual([1700, 1700]);
  });

  it("lists coupons for scans and fetches them one by one for live updates", async () => {
    const stripe = new FakeStripe();
    const coupons = ["coupon_a", "coupon_b", "coupon_c"].map((id) =>
      stripeCoupon({ id, percent_off: 10 }),
    );
    for (const coupon of coupons) {
      stripe.putCoupon(coupon);
      stripe.putSubscription(
        stripeSubscription({
          discounts: [stripeDiscount(coupon)],
          items: [stripeItem({ price: monthlyPrice(1000) })],
        }),
      );
    }
    const listed = (await stripe.listSubscriptions()).data;

    const bulk = createCatalog(stripe, { bulk: true });
    let before = stripe.requestCount;
    await bulk.complete(listed);
    // One listing of the products (for plan names) and one of the coupons.
    expect(stripe.requestCount - before).toBe(2);
    expect([...bulk.coupons.keys()].sort()).toEqual(["coupon_a", "coupon_b", "coupon_c"]);

    const single = createCatalog(stripe, { bulk: false });
    before = stripe.requestCount;
    await single.complete(listed);
    expect(stripe.requestCount - before).toBe(3);
  });

  it("remembers deleted coupons, whose discounts no longer count", async () => {
    const stripe = new FakeStripe();
    const deleted = stripeCoupon({ id: "coupon_gone", percent_off: 50 });
    const subscription = stripe.putSubscription(
      stripeSubscription({
        discounts: [stripeDiscount(deleted)],
        items: [stripeItem({ price: monthlyPrice(1000) })],
      }),
    );
    const catalog = createCatalog(stripe, { bulk: false });
    const listed = (await stripe.listSubscriptions()).data;

    const [completed] = await catalog.complete(listed);
    const before = stripe.requestCount;
    await catalog.complete(listed);

    expect(stripe.requestCount).toBe(before);
    expect(completed.discounts).toEqual([
      expect.objectContaining({ couponId: subscription.discounts?.[0].source?.coupon }),
    ]);
    expect(subscriptionMrr(completed, { coupons: catalog.coupons, at: 0 })).toBe(1000);
  });

  it("names products from the product list during scans", async () => {
    const stripe = new FakeStripe();
    stripe.putProduct({ id: "prod_pro", name: "Pro" });
    stripe.putSubscription(
      stripeSubscription({ items: [stripeItem({ price: monthlyPrice(1000) })] }),
    );
    const listed = (await stripe.listSubscriptions()).data;
    expect(listed[0].items[0].price.productName).toBeNull();

    const [completed] = await createCatalog(stripe, { bulk: true }).complete(listed);

    expect(completed.items[0].price.productName).toBe("Pro");
  });
});

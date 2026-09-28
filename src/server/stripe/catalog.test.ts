import { describe, expect, it, vi } from "vitest";
import { FakeStripe } from "@/test/fake-stripe";
import {
  monthlyPrice,
  stripeCoupon,
  stripeCustomer,
  stripeDiscount,
  stripeItem,
  stripePrice,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import { createCatalog, type CouponArchive } from "./catalog";
import { subscriptionMrr } from "./mrr";
import type { Coupon, Subscription } from "./types";

/** An archive in memory, like the database's for one account. */
function archiveInMemory(): CouponArchive & { coupons: Map<string, Coupon> } {
  const coupons = new Map<string, Coupon>();
  return {
    accountId: "account_1",
    coupons,
    async recall(ids) {
      return new Map(ids.flatMap((id) => (coupons.has(id) ? [[id, coupons.get(id)!]] : [])));
    },
    async remember(read) {
      for (const coupon of read) coupons.set(coupon.id, coupon);
    },
  };
}

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
    const catalog = createCatalog(stripe, { bulk: false, archive: archiveInMemory() });

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
    const catalog = createCatalog(stripe, { bulk: true, archive: archiveInMemory() });
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

    const bulk = createCatalog(stripe, { bulk: true, archive: archiveInMemory() });
    let before = stripe.requestCount;
    await bulk.complete(listed);
    // One listing of the products (for plan names) and one of the coupons.
    expect(stripe.requestCount - before).toBe(2);
    expect([...bulk.coupons.keys()].sort()).toEqual(["coupon_a", "coupon_b", "coupon_c"]);

    const single = createCatalog(stripe, { bulk: false, archive: archiveInMemory() });
    before = stripe.requestCount;
    await single.complete(listed);
    expect(stripe.requestCount - before).toBe(3);
  });

  it("names products from the product list during scans", async () => {
    const stripe = new FakeStripe();
    stripe.putProduct({ id: "prod_pro", name: "Pro" });
    stripe.putSubscription(
      stripeSubscription({ items: [stripeItem({ price: monthlyPrice(1000) })] }),
    );
    const listed = (await stripe.listSubscriptions()).data;
    expect(listed[0].items[0].price.productName).toBeNull();

    const [completed] = await createCatalog(stripe, {
      bulk: true,
      archive: archiveInMemory(),
    }).complete(listed);

    expect(completed.items[0].price.productName).toBe("Pro");
  });

  describe("coupons Stripe deleted", () => {
    // Deleting a coupon only stops new redemptions: Stripe keeps applying existing discounts.
    const halfOffPro = stripeCoupon({
      id: "coupon_launch",
      percent_off: 50,
      applies_to: { products: ["prod_pro"] },
    });
    const items = [
      stripeItem({ price: monthlyPrice(10_000, { product: "prod_pro" }) }),
      stripeItem({ price: monthlyPrice(2000, { product: "prod_addon" }) }),
    ];
    const mrrOf = (subscription: Subscription, coupons: ReadonlyMap<string, Coupon>) =>
      subscriptionMrr(subscription, { coupons, at: 0 });

    it("archives the coupons it reads, from listings and one by one", async () => {
      const stripe = new FakeStripe();
      stripe.putCoupon(halfOffPro);
      stripe.putSubscription(
        stripeSubscription({ discounts: [stripeDiscount(halfOffPro)], items }),
      );
      const listed = (await stripe.listSubscriptions()).data;

      for (const bulk of [true, false]) {
        const archive = archiveInMemory();
        await createCatalog(stripe, { bulk, archive }).complete(listed);
        expect(archive.coupons.get("coupon_launch")).toMatchObject({
          percentOff: 50,
          appliesToProducts: ["prod_pro"],
        });
      }
    });

    it.each([
      { bulk: true, requests: 2 },
      { bulk: false, requests: 1 },
    ])("keeps its discounts with the archived terms (bulk: $bulk)", async ({ bulk, requests }) => {
      const stripe = new FakeStripe();
      stripe.putCoupon(halfOffPro);
      const subscription = stripeSubscription({ discounts: [stripeDiscount(halfOffPro)], items });
      stripe.putSubscription(subscription);
      const archive = archiveInMemory();
      await createCatalog(stripe, { bulk, archive }).complete(
        (await stripe.listSubscriptions()).data,
      );

      stripe.deleteCoupon(halfOffPro.id);
      const retrieved = await stripe.retrieveSubscription(subscription.id);
      const catalog = createCatalog(stripe, { bulk, archive });
      const before = stripe.requestCount;
      const [completed] = await catalog.complete([retrieved!]);

      // A scan lists products and coupons, then trusts the archive for those it did not list; a
      // live update asks for the coupon first.
      expect(stripe.requestCount - before).toBe(requests);
      // The product restriction came from the archive: the add-on stays at full price.
      expect(mrrOf(completed, catalog.coupons)).toBe(5000 + 2000);
    });

    it("reads a coupon deleted before it was archived from the discount embedding it", async () => {
      const stripe = new FakeStripe();
      stripe.embedsDeletedCoupons = true;
      stripe.putCoupon(halfOffPro);
      stripe.deleteCoupon(halfOffPro.id);
      stripe.putSubscription(
        stripeSubscription({ discounts: [stripeDiscount(halfOffPro)], items }),
      );
      const archive = archiveInMemory();
      const catalog = createCatalog(stripe, { bulk: true, archive });

      const [completed] = await catalog.complete((await stripe.listSubscriptions()).data);

      // Stripe embeds no product restriction: the coupon is assumed to apply to every item.
      expect(mrrOf(completed, catalog.coupons)).toBe(6000);
      // Listings cannot embed the coupons of customer and item discounts: archived for them.
      expect(archive.coupons.get("coupon_launch")).toMatchObject({ appliesToProducts: null });
    });

    it("applies an embedded coupon to other discounts of the same coupon", async () => {
      const stripe = new FakeStripe();
      stripe.embedsDeletedCoupons = true;
      const coupon = stripeCoupon({ id: "coupon_old", percent_off: 20 });
      stripe.putCoupon(coupon);
      stripe.deleteCoupon(coupon.id);
      stripe.putSubscription(
        stripeSubscription({
          customer: stripeCustomer({ discount: stripeDiscount(coupon) }),
          items: [stripeItem({ price: monthlyPrice(1000) })],
        }),
      );
      stripe.putSubscription(
        stripeSubscription({
          discounts: [stripeDiscount(coupon)],
          items: [stripeItem({ price: monthlyPrice(1000) })],
        }),
      );
      const catalog = createCatalog(stripe, { bulk: true, archive: archiveInMemory() });

      const completed = await catalog.complete((await stripe.listSubscriptions()).data);

      expect(completed.map((subscription) => mrrOf(subscription, catalog.coupons))).toEqual([
        800, 800,
      ]);
    });

    it("leaves out a discount whose coupon no source knows, and says so once", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const stripe = new FakeStripe();
      stripe.putCoupon(halfOffPro);
      stripe.deleteCoupon(halfOffPro.id);
      for (let index = 0; index < 2; index += 1) {
        stripe.putSubscription(
          stripeSubscription({ discounts: [stripeDiscount(halfOffPro)], items }),
        );
      }
      const catalog = createCatalog(stripe, { bulk: false, archive: archiveInMemory() });
      const listed = (await stripe.listSubscriptions()).data;

      const completed = await catalog.complete(listed);
      const before = stripe.requestCount;
      await catalog.complete(listed);

      expect(completed.map((subscription) => mrrOf(subscription, catalog.coupons))).toEqual([
        12_000, 12_000,
      ]);
      expect(stripe.requestCount).toBe(before);
      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls[0][0]).toContain("coupon_launch");
    });
  });
});

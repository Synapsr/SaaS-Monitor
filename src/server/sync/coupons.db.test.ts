import { and, asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { mrrMovements, stripeCoupons } from "@/db/schema";
import { HOUR_SECONDS, MINUTE_SECONDS } from "@/lib/durations";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import {
  monthlyPrice,
  stripeCoupon,
  stripeCustomer,
  stripeDiscount,
  stripeItem,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import { createStripeAccount, mrrTotals } from "@/test/stripe-accounts";
import { syncAccount } from "./run";

/*
 * Deleting a coupon in Stripe only stops new redemptions: existing discounts keep applying, so
 * the MRR must not change. Stripe no longer returns the coupon, though.
 */

const T0 = Date.parse("2026-03-15T12:00:00Z") / 1000;
const RECONCILE = 26 * HOUR_SECONDS;

describe("coupons deleted in Stripe", () => {
  let stripe: FakeStripe;
  let accountId: string;
  const launch = stripeCoupon({ id: "coupon_launch", percent_off: 50 });

  const syncAt = (seconds: number) =>
    syncAccount(accountId, {
      createGateway: () => stripe,
      now: () => new Date((T0 + seconds) * 1000),
    });

  const movements = () =>
    db()
      .select({ kind: mrrMovements.kind, amount: mrrMovements.amount, origin: mrrMovements.origin })
      .from(mrrMovements)
      .where(eq(mrrMovements.accountId, accountId))
      .orderBy(asc(mrrMovements.occurredAt));

  async function expectMrr(usd: number) {
    const totals = await mrrTotals(accountId);
    expect(totals.mirror).toEqual({ usd });
    expect(totals.ledger).toEqual(totals.mirror);
  }

  function putSubscription(fixture: Parameters<typeof stripeSubscription>[0]) {
    return stripe.putSubscription(
      stripeSubscription({
        start_date: T0 - 30 * 24 * HOUR_SECONDS,
        items: [stripeItem({ price: monthlyPrice(10_000) })],
        ...fixture,
      }),
    );
  }

  beforeEach(async () => {
    await resetDatabase();
    const { workspaceId } = await createUserWithWorkspace();
    accountId = (await createStripeAccount(workspaceId, { now: new Date(T0 * 1000) })).id;
    stripe = new FakeStripe();
    stripe.putCoupon(launch);
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it.each([false, true])(
    "keeps the discount of a coupon deleted after the import (embedded when deleted: %s)",
    async (embedsDeletedCoupons) => {
      stripe.embedsDeletedCoupons = embedsDeletedCoupons;
      const subscription = putSubscription({ discounts: [stripeDiscount(launch)] });
      await syncAt(0);
      await expectMrr(5000);

      stripe.deleteCoupon(launch.id);
      stripe.emit("customer.subscription.updated", { id: subscription.id }, T0 + MINUTE_SECONDS);
      await syncAt(2 * MINUTE_SECONDS);
      await syncAt(RECONCILE);

      await expectMrr(5000);
      expect(await movements()).toEqual([{ kind: "new", amount: 5000, origin: "backfill" }]);
    },
  );

  it("applies the discount of a coupon deleted before the import, as its discount embeds it", async () => {
    stripe.embedsDeletedCoupons = true;
    putSubscription({ discounts: [stripeDiscount(launch)] });
    stripe.deleteCoupon(launch.id);

    await syncAt(0);

    await expectMrr(5000);
  });

  it("keeps a customer's discount once a live update has read its deleted coupon", async () => {
    stripe.embedsDeletedCoupons = true;
    const subscription = putSubscription({
      customer: stripeCustomer({ discount: stripeDiscount(launch) }),
    });
    stripe.deleteCoupon(launch.id);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Listings cannot embed the coupon of a customer's discount: the import cannot know it.
    await syncAt(0);
    await expectMrr(10_000);
    stripe.emit("customer.subscription.updated", { id: subscription.id }, T0 + MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);
    await expectMrr(5000);
    // The reconcile finds its terms in the archive, rather than undoing the correction.
    await syncAt(RECONCILE);

    await expectMrr(5000);
    expect((await movements()).map(({ kind, origin }) => `${kind}:${origin}`)).toEqual([
      "new:backfill",
      "contraction:live",
    ]);
  });

  it("leaves out a discount whose coupon no source knows, and says so", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    putSubscription({ discounts: [stripeDiscount(launch)] });
    putSubscription({ discounts: [stripeDiscount(launch)] });
    stripe.deleteCoupon(launch.id);

    await syncAt(0);

    await expectMrr(20_000);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain(`account=${accountId}: coupon coupon_launch`);
    expect(
      await db().$count(
        stripeCoupons,
        and(eq(stripeCoupons.accountId, accountId), eq(stripeCoupons.couponId, launch.id)),
      ),
    ).toBe(0);
  });
});

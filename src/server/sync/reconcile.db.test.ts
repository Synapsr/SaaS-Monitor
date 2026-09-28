import { and, asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { mrrMovements } from "@/db/schema";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import {
  monthlyPrice,
  stripeCoupon,
  stripeDiscount,
  stripeItem,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import { createStripeAccount, getStripeAccount, mrrTotals } from "@/test/stripe-accounts";
import { syncAccount } from "./run";

const IMPORTED_AT = new Date("2026-03-15T12:00:00Z");
const T0 = IMPORTED_AT.getTime() / 1000;
const HOUR = 3600;
const time = (seconds: number) => new Date((T0 + seconds) * 1000);

describe("reconcile", () => {
  let stripe: FakeStripe;
  let accountId: string;

  const syncAt = (seconds: number, options: { scanBudgetMs?: number } = {}) =>
    syncAccount(accountId, { createGateway: () => stripe, now: () => time(seconds), ...options });

  const reconciled = () =>
    db()
      .select({
        subscription: mrrMovements.stripeSubscriptionId,
        kind: mrrMovements.kind,
        amount: mrrMovements.amount,
        occurredAt: mrrMovements.occurredAt,
      })
      .from(mrrMovements)
      .where(and(eq(mrrMovements.accountId, accountId), eq(mrrMovements.origin, "reconcile")))
      .orderBy(asc(mrrMovements.stripeSubscriptionId));

  beforeEach(async () => {
    await resetDatabase();
    const { workspaceId } = await createUserWithWorkspace();
    accountId = (await createStripeAccount(workspaceId, { now: IMPORTED_AT })).id;

    stripe = new FakeStripe();
    const halfOff = stripeCoupon({ id: "coupon_launch", percent_off: 50, duration: "repeating" });
    stripe.putCoupon(halfOff);
    for (const [id, amount] of [
      ["sub_stable", 1000],
      ["sub_upgraded", 2000],
      ["sub_canceled", 4900],
    ] as const) {
      stripe.putSubscription(
        stripeSubscription({
          id,
          start_date: T0 - 40 * 24 * HOUR,
          items: [stripeItem({ price: monthlyPrice(amount) })],
        }),
      );
    }
    stripe.putSubscription(
      stripeSubscription({
        id: "sub_launch_offer",
        start_date: T0 - 40 * 24 * HOUR,
        discounts: [stripeDiscount(halfOff, { end: T0 + 3 * HOUR })],
        items: [stripeItem({ price: monthlyPrice(10_000) })],
      }),
    );
    await syncAt(0);
  });

  it("fixes what events did not announce, dating changes as well as Stripe allows", async () => {
    // Changes without events: Stripe ends discounts silently, and events expire after 30 days.
    stripe.updateSubscription("sub_upgraded", (subscription) => ({
      ...subscription,
      items: { ...subscription.items, data: [{ ...subscription.items.data[0], quantity: 2 }] },
    }));
    stripe.updateSubscription("sub_canceled", (subscription) => ({
      ...subscription,
      status: "canceled",
      canceled_at: T0 + 2 * HOUR,
      ended_at: T0 + 2 * HOUR,
    }));
    stripe.putSubscription(
      stripeSubscription({
        id: "sub_unannounced",
        start_date: T0 + HOUR,
        items: [stripeItem({ price: monthlyPrice(2900) })],
      }),
    );

    const report = await syncAt(25 * HOUR);

    expect(report).toMatchObject({ ok: true, mode: "reconcile" });
    expect(await reconciled()).toEqual([
      { subscription: "sub_canceled", kind: "churn", amount: -4900, occurredAt: time(2 * HOUR) },
      {
        subscription: "sub_launch_offer",
        kind: "expansion",
        amount: 5000,
        occurredAt: time(25 * HOUR),
      },
      { subscription: "sub_unannounced", kind: "new", amount: 2900, occurredAt: time(HOUR) },
      {
        subscription: "sub_upgraded",
        kind: "expansion",
        amount: 2000,
        occurredAt: time(25 * HOUR),
      },
    ]);
    const account = await getStripeAccount(accountId);
    expect(account).toMatchObject({ reconcile: null, lastReconciledAt: time(25 * HOUR) });
    const totals = await mrrTotals(accountId);
    expect(totals.ledger).toEqual(totals.mirror);
  });

  it("waits a day between reconciles", async () => {
    stripe.updateSubscription("sub_canceled", (subscription) => ({
      ...subscription,
      status: "canceled",
    }));

    expect(await syncAt(23 * HOUR)).toMatchObject({ mode: "incremental" });
    expect(await reconciled()).toEqual([]);
  });

  it("changes nothing once the mirror is right", async () => {
    await syncAt(2 * HOUR);
    stripe.updateSubscription("sub_launch_offer", (subscription) => ({
      ...subscription,
      discounts: [],
    }));

    await syncAt(25 * HOUR);
    await syncAt(50 * HOUR);

    expect((await reconciled()).map(({ subscription }) => subscription)).toEqual([
      "sub_launch_offer",
    ]);
  });

  it("resumes across runs until every page is checked", async () => {
    stripe.pageSize = 1;
    stripe.updateSubscription("sub_canceled", (subscription) => ({
      ...subscription,
      status: "canceled",
      ended_at: T0 + 2 * HOUR,
    }));

    let runs = 0;
    do {
      await syncAt(25 * HOUR, { scanBudgetMs: 0 });
      runs += 1;
    } while ((await getStripeAccount(accountId)).reconcile && runs < 10);

    expect(runs).toBe(4);
    expect((await reconciled()).map(({ kind }) => kind)).toEqual(["churn", "expansion"]);
    const totals = await mrrTotals(accountId);
    expect(totals.ledger).toEqual(totals.mirror);
  });
});

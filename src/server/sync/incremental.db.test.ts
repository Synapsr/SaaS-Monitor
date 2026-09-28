import { and, asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { mrrMovements, payments, stripeAccounts } from "@/db/schema";
import { chargeSchema, type SubscriptionInput } from "@/server/stripe/normalize";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import {
  monthlyPrice,
  stripeCharge,
  stripeCoupon,
  stripeCustomer,
  stripeDiscount,
  stripeItem,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import { createStripeAccount, getStripeAccount, mrrTotals } from "@/test/stripe-accounts";
import { applyCharges } from "./apply";
import { syncAccount } from "./run";

const IMPORTED_AT = new Date("2026-03-15T12:00:00Z");
const T0 = IMPORTED_AT.getTime() / 1000;
const MINUTE = 60;

describe("live updates", () => {
  let stripe: FakeStripe;
  let accountId: string;

  const syncAt = (seconds: number) =>
    syncAccount(accountId, {
      createGateway: () => stripe,
      now: () => new Date((T0 + seconds) * 1000),
    });

  async function liveMovements() {
    return db()
      .select({
        subscription: mrrMovements.stripeSubscriptionId,
        kind: mrrMovements.kind,
        amount: mrrMovements.amount,
        occurredAt: mrrMovements.occurredAt,
        eventId: mrrMovements.stripeEventId,
      })
      .from(mrrMovements)
      .where(and(eq(mrrMovements.accountId, accountId), eq(mrrMovements.origin, "live")))
      .orderBy(asc(mrrMovements.occurredAt));
  }

  async function expectLedgerToMatchMirror() {
    const totals = await mrrTotals(accountId);
    expect(totals.ledger).toEqual(totals.mirror);
  }

  /** Changes a subscription in Stripe and emits the matching event. */
  function change(
    id: string,
    update: (subscription: SubscriptionInput) => SubscriptionInput,
    atSeconds: number,
    type = "customer.subscription.updated",
  ) {
    const subscription = stripe.updateSubscription(id, update);
    return stripe.emit(type, subscription, T0 + atSeconds);
  }

  beforeEach(async () => {
    await resetDatabase();
    const { workspaceId } = await createUserWithWorkspace();
    accountId = (await createStripeAccount(workspaceId, { now: IMPORTED_AT })).id;

    stripe = new FakeStripe();
    stripe.putProduct({ id: "prod_pro", name: "Pro" });
    stripe.putSubscription(
      stripeSubscription({
        id: "sub_ada",
        customer: stripeCustomer({ id: "cus_ada", name: "Ada Lovelace" }),
        start_date: T0 - 30 * 24 * 3600,
        items: [stripeItem({ id: "si_ada", price: monthlyPrice(4900) })],
      }),
    );
    stripe.putSubscription(
      stripeSubscription({
        id: "sub_lapsed",
        status: "unpaid",
        start_date: T0 - 90 * 24 * 3600,
        items: [
          stripeItem({ price: monthlyPrice(1900), current_period_start: T0 - 10 * 24 * 3600 }),
        ],
      }),
    );
    await syncAt(0);
    expect((await getStripeAccount(accountId)).status).toBe("ready");
  });

  it("records a new subscription when it starts paying", async () => {
    const subscription = stripe.putSubscription(
      stripeSubscription({ id: "sub_new", items: [stripeItem({ price: monthlyPrice(2900) })] }),
    );
    const event = stripe.emit("customer.subscription.created", subscription, T0 + MINUTE);

    const report = await syncAt(2 * MINUTE);

    expect(report).toMatchObject({ ok: true, mode: "incremental", changes: 1 });
    expect(await liveMovements()).toEqual([
      {
        subscription: "sub_new",
        kind: "new",
        amount: 2900,
        occurredAt: new Date((T0 + MINUTE) * 1000),
        eventId: event.id,
      },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("records upgrades and downgrades", async () => {
    const withQuantity = (quantity: number) => (subscription: SubscriptionInput) => ({
      ...subscription,
      items: { ...subscription.items, data: [{ ...subscription.items.data[0], quantity }] },
    });
    change("sub_ada", withQuantity(3), MINUTE);
    await syncAt(2 * MINUTE);
    change("sub_ada", withQuantity(2), 3 * MINUTE);
    await syncAt(4 * MINUTE);

    expect((await liveMovements()).map(({ kind, amount }) => ({ kind, amount }))).toEqual([
      { kind: "expansion", amount: 9800 },
      { kind: "contraction", amount: -4900 },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("records a churn when a subscription is canceled", async () => {
    change(
      "sub_ada",
      (subscription) => ({ ...subscription, status: "canceled", ended_at: T0 + MINUTE }),
      MINUTE,
      "customer.subscription.deleted",
    );
    await syncAt(2 * MINUTE);

    expect(await liveMovements()).toMatchObject([{ kind: "churn", amount: -4900 }]);
    await expectLedgerToMatchMirror();
  });

  it("churns when a cancellation is requested and reactivates when it is withdrawn", async () => {
    change(
      "sub_ada",
      (subscription) => ({ ...subscription, cancel_at_period_end: true, canceled_at: T0 + MINUTE }),
      MINUTE,
    );
    await syncAt(2 * MINUTE);
    change(
      "sub_ada",
      (subscription) => ({ ...subscription, cancel_at_period_end: false, canceled_at: null }),
      3 * MINUTE,
    );
    await syncAt(4 * MINUTE);

    expect((await liveMovements()).map(({ kind, amount }) => ({ kind, amount }))).toEqual([
      { kind: "churn", amount: -4900 },
      { kind: "reactivation", amount: 4900 },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("recognises a comeback as a reactivation", async () => {
    change("sub_lapsed", (subscription) => ({ ...subscription, status: "active" }), MINUTE);
    await syncAt(2 * MINUTE);

    expect(await liveMovements()).toMatchObject([
      { subscription: "sub_lapsed", kind: "reactivation", amount: 1900 },
    ]);
  });

  it("counts a converted trial as new MRR", async () => {
    stripe.putSubscription(
      stripeSubscription({ id: "sub_trial", status: "trialing", trial_end: T0 + MINUTE }),
    );
    stripe.emit("customer.subscription.created", { id: "sub_trial" }, T0 + 10);
    await syncAt(30);
    change("sub_trial", (subscription) => ({ ...subscription, status: "active" }), MINUTE);
    await syncAt(2 * MINUTE);

    expect(await liveMovements()).toMatchObject([
      { subscription: "sub_trial", kind: "new", amount: 2000 },
    ]);
  });

  it("applies a discount added to the customer to their subscriptions", async () => {
    const coupon = stripeCoupon({ id: "coupon_half", percent_off: 50 });
    stripe.putCoupon(coupon);
    const discount = stripeDiscount(coupon);
    stripe.updateSubscription("sub_ada", (subscription) => ({
      ...subscription,
      customer: stripeCustomer({ id: "cus_ada", name: "Ada Lovelace", discount }),
    }));
    stripe.emit(
      "customer.discount.created",
      { ...discount, customer: "cus_ada", subscription: null },
      T0 + MINUTE,
    );

    await syncAt(2 * MINUTE);

    expect(await liveMovements()).toMatchObject([
      { subscription: "sub_ada", kind: "contraction", amount: -2450 },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("applies each change once, however often events are replayed", async () => {
    change("sub_ada", (subscription) => ({ ...subscription, status: "canceled" }), MINUTE);
    await syncAt(2 * MINUTE);
    // Later syncs read the same events again (the cursor overlaps), even from further back.
    await syncAt(3 * MINUTE);
    await db()
      .update(stripeAccounts)
      .set({ eventsCursor: T0 })
      .where(eq(stripeAccounts.id, accountId));
    await syncAt(4 * MINUTE);

    expect(await liveMovements()).toHaveLength(1);
    await expectLedgerToMatchMirror();
  });

  it("records payments and keeps their refunds up to date", async () => {
    const charge = stripe.putCharge(
      stripeCharge({ id: "ch_live", amount: 4900, created: T0 + MINUTE }),
    );
    stripe.emit("charge.succeeded", charge, T0 + MINUTE);
    await syncAt(2 * MINUTE);
    const refunded = stripe.putCharge({ ...charge, amount_refunded: 1000 });
    stripe.emit("charge.refunded", refunded, T0 + 3 * MINUTE);
    await syncAt(4 * MINUTE);

    const rows = await db().select().from(payments).where(eq(payments.accountId, accountId));
    expect(rows).toMatchObject([
      { stripeChargeId: "ch_live", amount: 4900, amountRefunded: 1000, origin: "live" },
    ]);
  });

  it("never celebrates an imported payment", async () => {
    const charge = stripe.putCharge(stripeCharge({ id: "ch_seen", created: T0 - MINUTE }));
    // Imported by a scan first, then announced by its event.
    await db().transaction((tx) =>
      applyCharges(tx, accountId, [chargeSchema.parse(charge)], "backfill"),
    );
    stripe.emit("charge.succeeded", charge, T0 + MINUTE);
    await syncAt(2 * MINUTE);

    const [row] = await db().select().from(payments).where(eq(payments.stripeChargeId, "ch_seen"));
    expect(row.origin).toBe("backfill");
  });

  it("moves the cursor to the newest event", async () => {
    stripe.emit("customer.subscription.updated", { id: "sub_ada" }, T0 + MINUTE);
    stripe.emit("customer.subscription.updated", { id: "sub_ada" }, T0 + 2 * MINUTE);
    await syncAt(3 * MINUTE);

    const account = await getStripeAccount(accountId);
    expect(account.eventsCursor).toBe(T0 + 2 * MINUTE);
    expect(account.lastEventAt).toEqual(new Date((T0 + 2 * MINUTE) * 1000));
  });

  it("catches up with a scan when too many subscriptions changed at once", async () => {
    for (let index = 0; index < 51; index += 1) {
      const subscription = stripe.putSubscription(stripeSubscription({ start_date: T0 + MINUTE }));
      stripe.emit("customer.subscription.created", subscription, T0 + MINUTE);
    }

    const report = await syncAt(2 * MINUTE);

    expect(report).toMatchObject({ ok: true, mode: "reconcile" });
    expect(await liveMovements()).toEqual([]);
    expect(
      await db().$count(
        mrrMovements,
        and(eq(mrrMovements.accountId, accountId), eq(mrrMovements.origin, "reconcile")),
      ),
    ).toBe(51);
    expect((await getStripeAccount(accountId)).reconcile).toBeNull();
    await expectLedgerToMatchMirror();
  });

  it("catches up with a scan after a month without syncing", async () => {
    const monthLater = 31 * 24 * 3600;
    stripe.putCharge(stripeCharge({ id: "ch_missed", created: T0 + monthLater - 3600 }));
    change(
      "sub_ada",
      (subscription) => ({ ...subscription, status: "canceled", ended_at: T0 + 3600 }),
      3600,
    );

    const report = await syncAt(monthLater);

    expect(report).toMatchObject({ ok: true, mode: "reconcile" });
    const account = await getStripeAccount(accountId);
    expect(account.eventsCursor).toBe(T0 + monthLater);
    expect(await db().select().from(payments)).toMatchObject([
      { stripeChargeId: "ch_missed", origin: "reconcile" },
    ]);
    expect(
      await db()
        .select({ kind: mrrMovements.kind, occurredAt: mrrMovements.occurredAt })
        .from(mrrMovements)
        .where(eq(mrrMovements.origin, "reconcile")),
    ).toEqual([{ kind: "churn", occurredAt: new Date((T0 + 3600) * 1000) }]);
    await expectLedgerToMatchMirror();
  });
});

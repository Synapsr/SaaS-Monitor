import { and, asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { mrrMovements, payments, stripeAccounts } from "@/db/schema";
import { DAY_SECONDS, HOUR_SECONDS, MINUTE_SECONDS } from "@/lib/durations";
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
const at = (seconds: number) => new Date((T0 + seconds) * 1000);

describe("live updates", () => {
  let stripe: FakeStripe;
  let accountId: string;

  const syncAt = (seconds: number, options: { scanBudgetMs?: number } = {}) =>
    syncAccount(accountId, { createGateway: () => stripe, now: () => at(seconds), ...options });

  const withQuantity = (quantity: number) => (subscription: SubscriptionInput) => ({
    ...subscription,
    items: { ...subscription.items, data: [{ ...subscription.items.data[0], quantity }] },
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
        start_date: T0 - 30 * DAY_SECONDS,
        items: [stripeItem({ id: "si_ada", price: monthlyPrice(4900) })],
      }),
    );
    stripe.putSubscription(
      stripeSubscription({
        id: "sub_lapsed",
        status: "unpaid",
        start_date: T0 - 90 * DAY_SECONDS,
        items: [
          stripeItem({ price: monthlyPrice(1900), current_period_start: T0 - 10 * DAY_SECONDS }),
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
    const event = stripe.emit("customer.subscription.created", subscription, T0 + MINUTE_SECONDS);

    const report = await syncAt(2 * MINUTE_SECONDS);

    expect(report).toMatchObject({ ok: true, mode: "incremental", changes: 1 });
    expect(await liveMovements()).toEqual([
      {
        subscription: "sub_new",
        kind: "new",
        amount: 2900,
        occurredAt: new Date((T0 + MINUTE_SECONDS) * 1000),
        eventId: event.id,
      },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("records upgrades and downgrades", async () => {
    change("sub_ada", withQuantity(3), MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);
    change("sub_ada", withQuantity(2), 3 * MINUTE_SECONDS);
    await syncAt(4 * MINUTE_SECONDS);

    expect((await liveMovements()).map(({ kind, amount }) => ({ kind, amount }))).toEqual([
      { kind: "expansion", amount: 9800 },
      { kind: "contraction", amount: -4900 },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("records a churn when a subscription is canceled", async () => {
    change(
      "sub_ada",
      (subscription) => ({ ...subscription, status: "canceled", ended_at: T0 + MINUTE_SECONDS }),
      MINUTE_SECONDS,
      "customer.subscription.deleted",
    );
    await syncAt(2 * MINUTE_SECONDS);

    expect(await liveMovements()).toMatchObject([{ kind: "churn", amount: -4900 }]);
    await expectLedgerToMatchMirror();
  });

  it("churns when a cancellation is requested and reactivates when it is withdrawn", async () => {
    change(
      "sub_ada",
      (subscription) => ({
        ...subscription,
        cancel_at_period_end: true,
        canceled_at: T0 + MINUTE_SECONDS,
      }),
      MINUTE_SECONDS,
    );
    await syncAt(2 * MINUTE_SECONDS);
    change(
      "sub_ada",
      (subscription) => ({ ...subscription, cancel_at_period_end: false, canceled_at: null }),
      3 * MINUTE_SECONDS,
    );
    await syncAt(4 * MINUTE_SECONDS);

    expect((await liveMovements()).map(({ kind, amount }) => ({ kind, amount }))).toEqual([
      { kind: "churn", amount: -4900 },
      { kind: "reactivation", amount: 4900 },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("recognizes a comeback as a reactivation", async () => {
    change("sub_lapsed", (subscription) => ({ ...subscription, status: "active" }), MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);

    expect(await liveMovements()).toMatchObject([
      { subscription: "sub_lapsed", kind: "reactivation", amount: 1900 },
    ]);
  });

  it("counts a converted trial as new MRR", async () => {
    stripe.putSubscription(
      stripeSubscription({ id: "sub_trial", status: "trialing", trial_end: T0 + MINUTE_SECONDS }),
    );
    stripe.emit("customer.subscription.created", { id: "sub_trial" }, T0 + 10);
    await syncAt(30);
    change("sub_trial", (subscription) => ({ ...subscription, status: "active" }), MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);

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
      T0 + MINUTE_SECONDS,
    );

    await syncAt(2 * MINUTE_SECONDS);

    expect(await liveMovements()).toMatchObject([
      { subscription: "sub_ada", kind: "contraction", amount: -2450 },
    ]);
    await expectLedgerToMatchMirror();
  });

  it("applies each change once, however often events are replayed", async () => {
    change("sub_ada", (subscription) => ({ ...subscription, status: "canceled" }), MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);
    // Later syncs read the same events again (the cursor overlaps), even from further back.
    await syncAt(3 * MINUTE_SECONDS);
    await db()
      .update(stripeAccounts)
      .set({ eventsCursor: T0 })
      .where(eq(stripeAccounts.id, accountId));
    await syncAt(4 * MINUTE_SECONDS);

    expect(await liveMovements()).toHaveLength(1);
    await expectLedgerToMatchMirror();
  });

  it("handles each event once, although the next syncs list it again", async () => {
    change("sub_ada", withQuantity(2), MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);

    const requests: number[] = [];
    for (const minutes of [3, 4, 5]) {
      const before = stripe.requestCount;
      await syncAt(minutes * MINUTE_SECONDS);
      requests.push(stripe.requestCount - before);
    }

    // A quiet sync costs the one request the polling pace allows for (see policy.ts).
    expect(requests).toEqual([1, 1, 1]);
    expect(await liveMovements()).toHaveLength(1);
  });

  it("still applies an event Stripe lists late, a little before the cursor", async () => {
    change("sub_ada", withQuantity(2), 2 * MINUTE_SECONDS);
    await syncAt(3 * MINUTE_SECONDS);
    stripe.putSubscription(stripeSubscription({ id: "sub_late", start_date: T0 }));
    stripe.emit("customer.subscription.created", { id: "sub_late" }, T0 + MINUTE_SECONDS);

    await syncAt(4 * MINUTE_SECONDS);

    expect((await liveMovements()).map(({ subscription }) => subscription)).toEqual([
      "sub_late",
      "sub_ada",
    ]);
  });

  it("records payments and keeps their refunds up to date", async () => {
    const charge = stripe.putCharge(
      stripeCharge({ id: "ch_live", amount: 4900, created: T0 + MINUTE_SECONDS }),
    );
    stripe.emit("charge.succeeded", charge, T0 + MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);
    const refunded = stripe.putCharge({ ...charge, amount_refunded: 1000 });
    stripe.emit("charge.refunded", refunded, T0 + 3 * MINUTE_SECONDS);
    await syncAt(4 * MINUTE_SECONDS);

    const rows = await db().select().from(payments).where(eq(payments.accountId, accountId));
    expect(rows).toMatchObject([
      { stripeChargeId: "ch_live", amount: 4900, amountRefunded: 1000, origin: "live" },
    ]);
  });

  it("never celebrates an imported payment", async () => {
    const charge = stripe.putCharge(stripeCharge({ id: "ch_seen", created: T0 - MINUTE_SECONDS }));
    // Imported by a scan first, then announced by its event.
    await db().transaction((tx) =>
      applyCharges(tx, accountId, [chargeSchema.parse(charge)], "backfill"),
    );
    stripe.emit("charge.succeeded", charge, T0 + MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);

    const [row] = await db().select().from(payments).where(eq(payments.stripeChargeId, "ch_seen"));
    expect(row.origin).toBe("backfill");
  });

  it("moves the cursor to the newest event", async () => {
    stripe.emit("customer.subscription.updated", { id: "sub_ada" }, T0 + MINUTE_SECONDS);
    stripe.emit("customer.subscription.updated", { id: "sub_ada" }, T0 + 2 * MINUTE_SECONDS);
    await syncAt(3 * MINUTE_SECONDS);

    const account = await getStripeAccount(accountId);
    expect(account.eventsCursor).toBe(T0 + 2 * MINUTE_SECONDS);
    expect(account.lastEventAt).toEqual(new Date((T0 + 2 * MINUTE_SECONDS) * 1000));
  });

  it("catches up with a scan when too many subscriptions changed at once", async () => {
    for (let index = 0; index < 51; index += 1) {
      const subscription = stripe.putSubscription(
        stripeSubscription({ start_date: T0 + MINUTE_SECONDS }),
      );
      stripe.emit("customer.subscription.created", subscription, T0 + MINUTE_SECONDS);
    }

    const report = await syncAt(2 * MINUTE_SECONDS);

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

  it("counts only new events towards a catch-up, so that its scan completes", async () => {
    for (let index = 0; index < 60; index += 1) {
      const subscription = stripe.putSubscription(stripeSubscription({ start_date: T0 }));
      stripe.emit("customer.subscription.updated", subscription, T0 + 100 + index);
    }
    stripe.pageSize = 10;

    // The events stay in the window the next syncs read again, until newer ones come.
    let runs = 0;
    do {
      runs += 1;
      await syncAt((4 + runs) * MINUTE_SECONDS, { scanBudgetMs: 0 });
    } while ((await getStripeAccount(accountId)).reconcile && runs < 20);

    // 62 subscriptions, 10 per page and one page per run.
    expect(runs).toBe(7);
    expect((await getStripeAccount(accountId)).lastReconciledAt).toEqual(at(5 * MINUTE_SECONDS));
    expect((await mrrTotals(accountId)).mirror).toEqual({ usd: 4900 + 60 * 2000 });
    await expectLedgerToMatchMirror();
  });

  it("lets a reconcile under way finish, then checks again what it had scanned", async () => {
    stripe.pageSize = 1;
    // The daily reconcile checks the newest subscription, then stops: one page per run.
    await syncAt(DAY_SECONDS, { scanBudgetMs: 0 });
    expect((await getStripeAccount(accountId)).reconcile).toMatchObject({ cursor: "sub_lapsed" });

    // Too many changes for events: sub_lapsed, already checked, pays again; 50 customers sign up.
    const burst = DAY_SECONDS + MINUTE_SECONDS;
    change("sub_lapsed", (subscription) => ({ ...subscription, status: "active" }), burst);
    for (let index = 0; index < 50; index += 1) {
      const subscription = stripe.putSubscription(stripeSubscription({ start_date: T0 + burst }));
      stripe.emit("customer.subscription.created", subscription, T0 + burst);
    }
    const caughtUpAt = DAY_SECONDS + 2 * MINUTE_SECONDS;
    await syncAt(caughtUpAt, { scanBudgetMs: 0 });

    // The reconcile checked its last page rather than starting over, and a new scan follows it.
    expect(await getStripeAccount(accountId)).toMatchObject({
      reconcile: { cursor: null, startedAt: at(caughtUpAt).toISOString() },
      lastReconciledAt: IMPORTED_AT,
    });
    stripe.pageSize = 100;
    await syncAt(caughtUpAt + MINUTE_SECONDS);

    expect(await getStripeAccount(accountId)).toMatchObject({
      reconcile: null,
      lastReconciledAt: at(caughtUpAt),
    });
    const reconciled = await db()
      .select({ subscription: mrrMovements.stripeSubscriptionId, kind: mrrMovements.kind })
      .from(mrrMovements)
      .where(and(eq(mrrMovements.accountId, accountId), eq(mrrMovements.origin, "reconcile")));
    expect(reconciled).toHaveLength(51);
    expect(reconciled).toContainEqual({ subscription: "sub_lapsed", kind: "reactivation" });
    await expectLedgerToMatchMirror();
  });

  it("catches up with a scan after a month without syncing", async () => {
    const monthLater = 31 * DAY_SECONDS;
    stripe.putCharge(stripeCharge({ id: "ch_missed", created: T0 + monthLater - HOUR_SECONDS }));
    change(
      "sub_ada",
      (subscription) => ({ ...subscription, status: "canceled", ended_at: T0 + HOUR_SECONDS }),
      HOUR_SECONDS,
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
    ).toEqual([{ kind: "churn", occurredAt: new Date((T0 + HOUR_SECONDS) * 1000) }]);
    await expectLedgerToMatchMirror();
  });
});

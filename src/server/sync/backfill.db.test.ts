import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { mrrMovements, payments, stripeAccounts, subscriptions } from "@/db/schema";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import {
  monthlyPrice,
  stripeCharge,
  stripeCoupon,
  stripeCustomer,
  stripeDiscount,
  stripeItem,
  stripePrice,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import { createStripeAccount, getStripeAccount, mrrTotals } from "@/test/stripe-accounts";
import { syncAccount } from "./run";

const NOW = new Date("2026-03-15T12:00:00Z");
const at = (iso: string) => Date.parse(iso) / 1000;

/** A small but varied Stripe account: every kind of subscription history the import handles. */
function seedStripe(stripe: FakeStripe) {
  stripe.putProduct({ id: "prod_pro", name: "Pro" });
  stripe.putProduct({ id: "prod_team", name: "Team" });
  const twentyPercent = stripeCoupon({ id: "coupon_20", percent_off: 20 });
  stripe.putCoupon(twentyPercent);
  const ada = stripeCustomer({ id: "cus_ada", name: "Ada Lovelace", country: "GB" });

  const put = (id: string, fixture: Parameters<typeof stripeSubscription>[0]) =>
    stripe.putSubscription(stripeSubscription({ id, customer: stripeCustomer(), ...fixture }));

  put("sub_discounted", {
    customer: ada,
    start_date: at("2026-01-10T09:00:00Z"),
    discounts: [stripeDiscount(twentyPercent)],
    items: [stripeItem({ price: monthlyPrice(4900) })],
  });
  put("sub_churned_yearly", {
    status: "canceled",
    start_date: at("2025-06-01T00:00:00Z"),
    canceled_at: at("2026-02-20T00:00:00Z"),
    ended_at: at("2026-02-20T00:00:00Z"),
    items: [
      stripeItem({
        price: monthlyPrice(12_000, {
          product: "prod_team",
          recurring: { interval: "year", interval_count: 1, usage_type: "licensed" },
        }),
      }),
    ],
  });
  put("sub_trialing", {
    status: "trialing",
    start_date: at("2026-03-01T00:00:00Z"),
    trial_end: at("2026-03-20T00:00:00Z"),
  });
  put("sub_converted", {
    start_date: at("2026-02-01T00:00:00Z"),
    trial_end: at("2026-02-15T00:00:00Z"),
    items: [stripeItem({ price: monthlyPrice(2900) })],
  });
  put("sub_cancel_requested", {
    cancel_at_period_end: true,
    canceled_at: at("2026-03-10T00:00:00Z"),
    start_date: at("2025-12-01T00:00:00Z"),
    items: [stripeItem({ price: monthlyPrice(9900) })],
  });
  put("sub_unpaid", {
    status: "unpaid",
    start_date: at("2026-01-01T00:00:00Z"),
    items: [
      stripeItem({ price: monthlyPrice(1900), current_period_start: at("2026-03-01T00:00:00Z") }),
    ],
  });
  put("sub_never_paid", { status: "incomplete_expired", start_date: at("2026-03-02T00:00:00Z") });
  put("sub_trial_expired", {
    status: "canceled",
    start_date: at("2026-02-01T00:00:00Z"),
    trial_end: at("2026-02-15T00:00:00Z"),
    ended_at: at("2026-02-15T00:00:00Z"),
  });
  put("sub_past_due", {
    status: "past_due",
    start_date: at("2026-02-03T00:00:00Z"),
    items: [stripeItem({ price: monthlyPrice(4900) })],
  });
  put("sub_euro", {
    currency: "eur",
    start_date: at("2026-02-10T00:00:00Z"),
    items: [stripeItem({ price: monthlyPrice(3000, { currency: "eur" }) })],
  });
  put("sub_tiered", {
    start_date: at("2026-01-20T00:00:00Z"),
    items: [
      stripeItem({
        quantity: 12,
        price: stripePrice({
          product: "prod_team",
          billing_scheme: "tiered",
          tiers_mode: "graduated",
          unit_amount: null,
          unit_amount_decimal: null,
          tiers: [
            { up_to: 10, unit_amount: 500 },
            { up_to: null, unit_amount: 300 },
          ],
        }),
      }),
    ],
  });
  put("sub_pounds", {
    currency: "gbp",
    start_date: at("2026-02-12T00:00:00Z"),
    items: [
      stripeItem({
        price: monthlyPrice(2000, {
          currency_options: { gbp: { unit_amount: 1500, unit_amount_decimal: "1500" } },
        }),
      }),
    ],
  });

  stripe.putCharge(
    stripeCharge({
      id: "ch_recent",
      amount: 3920,
      customer: "cus_ada",
      created: at("2026-03-14T10:00:00Z"),
      billing_details: { name: null, address: null },
      payment_method_details: null,
    }),
  );
  stripe.putCharge(
    stripeCharge({
      id: "ch_refunded",
      amount: 4900,
      amount_refunded: 900,
      created: at("2026-03-01T08:00:00Z"),
    }),
  );
  stripe.putCharge(
    stripeCharge({ id: "ch_failed", status: "failed", created: at("2026-03-05T08:00:00Z") }),
  );
  stripe.putCharge(stripeCharge({ id: "ch_old", created: at("2025-01-01T00:00:00Z") }));
  stripe.putCharge(
    stripeCharge({
      id: "ch_euro",
      amount: 3000,
      currency: "eur",
      created: at("2026-03-02T08:00:00Z"),
    }),
  );
}

async function movementsOf(accountId: string) {
  return db()
    .select({
      subscription: mrrMovements.stripeSubscriptionId,
      kind: mrrMovements.kind,
      amount: mrrMovements.amount,
      currency: mrrMovements.currency,
      occurredAt: mrrMovements.occurredAt,
      origin: mrrMovements.origin,
    })
    .from(mrrMovements)
    .where(eq(mrrMovements.accountId, accountId))
    .orderBy(asc(mrrMovements.occurredAt), asc(mrrMovements.stripeSubscriptionId));
}

describe("initial import", () => {
  let stripe: FakeStripe;
  let accountId: string;

  beforeEach(async () => {
    await resetDatabase();
    const { workspaceId } = await createUserWithWorkspace();
    accountId = (await createStripeAccount(workspaceId, { now: NOW })).id;
    stripe = new FakeStripe();
    seedStripe(stripe);
  });

  const sync = (options: { scanBudgetMs?: number } = {}) =>
    syncAccount(accountId, { createGateway: () => stripe, now: () => NOW, ...options });

  it("mirrors subscriptions with Stripe's MRR and rebuilds their history", async () => {
    const report = await sync();

    expect(report).toMatchObject({ ok: true, mode: "import" });
    const account = await getStripeAccount(accountId);
    expect(account).toMatchObject({ status: "ready", backfill: null, lastSyncedAt: NOW });
    expect(account.lastReconciledAt).toEqual(NOW);

    const mirrored = await db()
      .select({
        id: subscriptions.stripeSubscriptionId,
        status: subscriptions.status,
        mrr: subscriptions.mrr,
        planName: subscriptions.planName,
      })
      .from(subscriptions)
      .where(eq(subscriptions.accountId, accountId));
    expect(Object.fromEntries(mirrored.map((row) => [row.id, row.mrr]))).toEqual({
      sub_discounted: 3920,
      sub_churned_yearly: 0,
      sub_trialing: 0,
      sub_converted: 2900,
      sub_cancel_requested: 0,
      sub_unpaid: 0,
      sub_never_paid: 0,
      sub_trial_expired: 0,
      sub_past_due: 4900,
      sub_euro: 3000,
      sub_tiered: 5600,
      sub_pounds: 1500,
    });
    expect(mirrored.find((row) => row.id === "sub_churned_yearly")?.planName).toBe("Team");

    expect(await movementsOf(accountId)).toEqual([
      movement("sub_churned_yearly", "new", 1000, "2025-06-01T00:00:00Z"),
      movement("sub_cancel_requested", "new", 9900, "2025-12-01T00:00:00Z"),
      movement("sub_unpaid", "new", 1900, "2026-01-01T00:00:00Z"),
      movement("sub_discounted", "new", 3920, "2026-01-10T09:00:00Z"),
      movement("sub_tiered", "new", 5600, "2026-01-20T00:00:00Z"),
      movement("sub_past_due", "new", 4900, "2026-02-03T00:00:00Z"),
      movement("sub_euro", "new", 3000, "2026-02-10T00:00:00Z", "eur"),
      movement("sub_pounds", "new", 1500, "2026-02-12T00:00:00Z", "gbp"),
      movement("sub_converted", "new", 2900, "2026-02-15T00:00:00Z"),
      movement("sub_churned_yearly", "churn", -1000, "2026-02-20T00:00:00Z"),
      movement("sub_unpaid", "churn", -1900, "2026-03-01T00:00:00Z"),
      movement("sub_cancel_requested", "churn", -9900, "2026-03-10T00:00:00Z"),
    ]);

    const totals = await mrrTotals(accountId);
    expect(totals.mirror).toEqual({ usd: 3920 + 2900 + 4900 + 5600, eur: 3000, gbp: 1500 });
    expect(totals.ledger).toEqual(totals.mirror);
  });

  it("imports the collected payments of the last year", async () => {
    await sync();

    const imported = await db()
      .select({
        id: payments.stripeChargeId,
        amount: payments.amount,
        amountRefunded: payments.amountRefunded,
        currency: payments.currency,
        customerName: payments.customerName,
        origin: payments.origin,
      })
      .from(payments)
      .where(eq(payments.accountId, accountId))
      .orderBy(asc(payments.occurredAt));
    expect(imported).toEqual([
      {
        id: "ch_refunded",
        amount: 4900,
        amountRefunded: 900,
        currency: "usd",
        customerName: "Ada Lovelace",
        origin: "backfill",
      },
      {
        id: "ch_euro",
        amount: 3000,
        amountRefunded: 0,
        currency: "eur",
        customerName: "Ada Lovelace",
        origin: "backfill",
      },
      // No billing name: the customer's subscription knows it.
      {
        id: "ch_recent",
        amount: 3920,
        amountRefunded: 0,
        currency: "usd",
        customerName: "Ada Lovelace",
        origin: "backfill",
      },
    ]);
  });

  it("resumes from its saved cursor, one page per run", async () => {
    stripe.pageSize = 2;

    let runs = 0;
    while ((await getStripeAccount(accountId)).status === "importing") {
      await sync({ scanBudgetMs: 0 });
      runs += 1;
      expect(runs).toBeLessThan(20);
    }

    // 12 subscriptions, then 4 charges of the last year, 2 per page.
    expect(runs).toBe(6 + 2);
    expect(await movementsOf(accountId)).toHaveLength(12);
    const totals = await mrrTotals(accountId);
    expect(totals.ledger).toEqual(totals.mirror);
    expect(await db().$count(payments, eq(payments.accountId, accountId))).toBe(3);
  });

  it("reports its progress while importing", async () => {
    stripe.pageSize = 5;
    await sync({ scanBudgetMs: 0 });

    expect((await getStripeAccount(accountId)).backfill).toMatchObject({
      phase: "subscriptions",
      subscriptions: 5,
      payments: 0,
    });
  });

  it("does not duplicate history when a page is scanned twice", async () => {
    stripe.pageSize = 4;
    await sync({ scanBudgetMs: 0 });
    // As if the cursor had been lost after the first page was written.
    const account = await getStripeAccount(accountId);
    await db()
      .update(stripeAccounts)
      .set({ backfill: { ...account.backfill!, cursor: null } })
      .where(eq(stripeAccounts.id, accountId));
    while ((await getStripeAccount(accountId)).status === "importing") {
      await sync({ scanBudgetMs: 0 });
    }

    expect(await movementsOf(accountId)).toHaveLength(12);
    const totals = await mrrTotals(accountId);
    expect(totals.ledger).toEqual(totals.mirror);
  });
});

function movement(
  subscription: string,
  kind: string,
  amount: number,
  iso: string,
  currency = "usd",
) {
  return {
    subscription,
    kind,
    amount,
    currency,
    occurredAt: new Date(iso),
    origin: "backfill",
  };
}

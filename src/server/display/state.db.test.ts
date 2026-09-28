import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { mrrMovements, payments, stripeAccounts, subscriptions } from "@/db/schema";
import { calendarDay, chartDays, daysBetween } from "@/lib/display/calendar";
import type { MrrMovementKind } from "@/lib/display/types";
import { isTimeZone, type ScreenSettingsInput } from "@/lib/screens/settings";
import type { RateSource } from "@/server/fx";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import { createStripeAccount } from "@/test/stripe-accounts";
import { getDisplayStateByToken } from "./state";

const NOW = new Date("2026-03-15T12:00:00Z");

let workspaceId: string;

async function readyAccount(
  name = "Acme",
  overrides: Partial<typeof stripeAccounts.$inferInsert> = {},
) {
  return (
    await createStripeAccount(workspaceId, { name, status: "ready", backfill: null, ...overrides })
  ).id;
}

async function addSubscription(
  accountId: string,
  row: {
    id: string;
    mrr: number;
    customer?: string;
    status?: string;
    currency?: string;
    plan?: string;
    customerName?: string;
    country?: string;
  },
) {
  await db()
    .insert(subscriptions)
    .values({
      accountId,
      stripeSubscriptionId: row.id,
      stripeCustomerId: row.customer ?? `cus_${row.id}`,
      customerName: row.customerName ?? null,
      customerCountry: row.country ?? null,
      status: row.status ?? (row.mrr > 0 ? "active" : "canceled"),
      currency: row.currency ?? "usd",
      mrr: row.mrr,
      planName: row.plan ?? null,
      startedAt: new Date("2026-01-01T00:00:00Z"),
    });
}

async function addMovement(
  accountId: string,
  row: {
    subscription: string;
    kind: MrrMovementKind;
    amount: number;
    at: string;
    customer?: string;
    currency?: string;
    origin?: "backfill" | "live" | "reconcile";
  },
) {
  const [movement] = await db()
    .insert(mrrMovements)
    .values({
      accountId,
      stripeSubscriptionId: row.subscription,
      stripeCustomerId: row.customer ?? `cus_${row.subscription}`,
      customerName: "Ada Lovelace",
      customerCountry: "FR",
      planName: "Pro",
      kind: row.kind,
      amount: row.amount,
      currency: row.currency ?? "usd",
      occurredAt: new Date(row.at),
      origin: row.origin ?? "backfill",
    })
    .$returningId();
  return movement.id;
}

async function addPayment(
  accountId: string,
  row: {
    amount: number;
    at: string;
    refunded?: number;
    currency?: string;
    origin?: "backfill" | "live" | "reconcile";
    customer?: string;
  },
) {
  const [payment] = await db()
    .insert(payments)
    .values({
      accountId,
      stripeChargeId: `ch_${crypto.randomUUID()}`,
      stripeCustomerId: row.customer ?? null,
      customerName: "Grace Hopper",
      customerCountry: "US",
      amount: row.amount,
      amountRefunded: row.refunded ?? 0,
      currency: row.currency ?? "usd",
      occurredAt: new Date(row.at),
      origin: row.origin ?? "backfill",
    })
    .$returningId();
  return payment.id;
}

async function displayOf(
  accountIds: string[],
  settings: ScreenSettingsInput = {},
  options: Parameters<typeof getDisplayStateByToken>[1] = {},
) {
  const { token } = await createScreen(workspaceId, { accountIds, settings });
  const state = await getDisplayStateByToken(token, { now: NOW, ...options });
  if (!state) throw new Error("The screen should exist.");
  return state;
}

describe("display state", () => {
  beforeEach(async () => {
    await resetDatabase();
    ({ workspaceId } = await createUserWithWorkspace());
  });

  it("is null for an unknown or malformed token", async () => {
    expect(await getDisplayStateByToken("unknown", { now: NOW })).toBeNull();
    expect(await getDisplayStateByToken("", { now: NOW })).toBeNull();
    expect(await getDisplayStateByToken("x".repeat(300), { now: NOW })).toBeNull();
  });

  it("describes a screen without accounts", async () => {
    const state = await displayOf([], { currency: "eur", chartRange: "90d" });

    expect(state).toMatchObject({
      status: "empty",
      currency: "eur",
      screen: { name: "Office TV", settings: { currency: "eur" } },
      accounts: [],
      feed: [],
      warnings: [],
      testEvent: null,
      generatedAt: NOW.toISOString(),
    });
    expect(state.metrics.mrr).toBe(0);
    expect(state.series.mrr).toHaveLength(91);
  });

  it("sums MRR, paying customers and trials from the mirror", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, { id: "sub_1", mrr: 4900, customer: "cus_ada" });
    await addSubscription(accountId, { id: "sub_2", mrr: 1000, customer: "cus_ada" });
    await addSubscription(accountId, { id: "sub_3", mrr: 2900, customer: "cus_bob" });
    await addSubscription(accountId, { id: "sub_4", mrr: 0, status: "trialing" });
    await addSubscription(accountId, { id: "sub_5", mrr: 0 });

    const { metrics, accounts } = await displayOf([accountId]);

    expect(metrics).toMatchObject({
      mrr: 8800,
      arr: 8800 * 12,
      activeCustomers: 2,
      trialingSubscriptions: 1,
      arpu: 4400,
    });
    // Anyone with the link reads this state: it tells each account's name, never its MRR.
    expect(accounts).toEqual([{ id: accountId, name: "Acme", status: "ready", livemode: false }]);
  });

  it("rebuilds daily MRR from the ledger, ending on today's MRR", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, { id: "sub_a", mrr: 5000 });
    await addSubscription(accountId, { id: "sub_b", mrr: 3000 });
    await addSubscription(accountId, { id: "sub_c", mrr: 0 });
    await addMovement(accountId, {
      subscription: "sub_c",
      kind: "new",
      amount: 2000,
      at: "2026-01-10T10:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_a",
      kind: "new",
      amount: 5000,
      at: "2026-02-01T10:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_b",
      kind: "new",
      amount: 1000,
      at: "2026-03-01T10:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_b",
      kind: "expansion",
      amount: 2000,
      at: "2026-03-10T10:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_c",
      kind: "churn",
      amount: -2000,
      at: "2026-03-12T10:00:00Z",
    });

    const { metrics, series } = await displayOf([accountId], { chartRange: "30d" });

    expect(metrics.mrr30DaysAgo).toBe(7000);
    // From the day the growth is measured from: the same MRR as 30 days ago.
    expect(series.mrr).toHaveLength(31);
    const value = (date: string) => series.mrr.find((point) => point.date === date)?.value;
    expect(series.mrr[0]).toEqual({ date: "2026-02-13", value: 7000 });
    expect(value("2026-02-28")).toBe(7000);
    expect(value("2026-03-01")).toBe(8000);
    expect(value("2026-03-11")).toBe(10_000);
    expect(value("2026-03-12")).toBe(8000);
    expect(series.mrr.at(-1)).toEqual({ date: "2026-03-15", value: 8000 });
    expect(metrics.thisMonth).toEqual({
      new: 1000,
      expansion: 2000,
      reactivation: 0,
      contraction: 0,
      churn: -2000,
      net: 1000,
      newCustomers: 1,
    });
  });

  it("charts all time from the day of the first movement, in the screen's time zone", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, { id: "sub_a", mrr: 5000 });
    await addSubscription(accountId, { id: "sub_b", mrr: 3000 });
    // 23:30 UTC on January 9 is January 10 in Paris.
    await addMovement(accountId, {
      subscription: "sub_a",
      kind: "new",
      amount: 5000,
      at: "2026-01-09T23:30:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_b",
      kind: "new",
      amount: 3000,
      at: "2026-02-20T10:00:00Z",
    });

    const { metrics, series } = await displayOf([accountId], {
      chartRange: "all",
      timeZone: "Europe/Paris",
    });

    expect(series.mrr[0]).toEqual({ date: "2026-01-10", value: 5000 });
    expect(series.mrr).toHaveLength(daysBetween("2026-01-10", "2026-03-15") + 1);
    const value = (date: string) => series.mrr.find((point) => point.date === date)?.value;
    expect(value("2026-02-19")).toBe(5000);
    expect(value("2026-02-20")).toBe(8000);
    expect(series.mrr.at(-1)).toEqual({ date: "2026-03-15", value: metrics.mrr });
    expect(metrics.mrr30DaysAgo).toBe(5000);
  });

  it("samples a long history by week, then by month, and ends on today's MRR", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, { id: "sub_old", mrr: 1000 });
    await addSubscription(accountId, { id: "sub_new", mrr: 4000 });
    await addMovement(accountId, {
      subscription: "sub_old",
      kind: "new",
      amount: 1000,
      at: "2023-06-07T12:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_new",
      kind: "new",
      amount: 4000,
      at: "2026-03-11T12:00:00Z",
    });

    // Almost three years: the end of each week, from a Wednesday to today.
    const weekly = (await displayOf([accountId], { chartRange: "all" })).series.mrr;
    expect(weekly.map((point) => point.date)).toEqual(chartDays("2026-03-15", "all", "2023-06-07"));
    expect(weekly.slice(0, 2)).toEqual([
      { date: "2023-06-07", value: 1000 },
      { date: "2023-06-11", value: 1000 },
    ]);
    expect(weekly.slice(-2)).toEqual([
      { date: "2026-03-08", value: 1000 },
      { date: "2026-03-15", value: 5000 },
    ]);

    // A customer from ten years ago, gone since: the end of each month.
    await addSubscription(accountId, { id: "sub_first", mrr: 0 });
    await addMovement(accountId, {
      subscription: "sub_first",
      kind: "new",
      amount: 500,
      at: "2016-01-20T12:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_first",
      kind: "churn",
      amount: -500,
      at: "2019-05-10T12:00:00Z",
    });
    const { metrics, series } = await displayOf([accountId], { chartRange: "all" });

    expect(series.mrr.length).toBeLessThan(150);
    expect(series.mrr.slice(0, 3)).toEqual([
      { date: "2016-01-20", value: 500 },
      { date: "2016-01-31", value: 500 },
      { date: "2016-02-29", value: 500 },
    ]);
    const value = (date: string) => series.mrr.find((point) => point.date === date)?.value;
    expect(value("2019-04-30")).toBe(500);
    expect(value("2019-05-31")).toBe(0);
    expect(value("2023-06-30")).toBe(1000);
    expect(series.mrr.at(-1)).toEqual({ date: "2026-03-15", value: metrics.mrr });
  });

  it("charts all time like the last 30 days without any movement", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, { id: "sub_trial", mrr: 0, status: "trialing" });

    for (const accountIds of [[accountId], []]) {
      const { series } = await displayOf(accountIds, { chartRange: "all" });
      expect(series.mrr).toHaveLength(31);
      expect(series.mrr[0]).toEqual({ date: "2026-02-13", value: 0 });
    }
  });

  it("only counts customers who paid nothing before as new", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, { id: "sub_1", mrr: 1000, customer: "cus_loyal" });
    await addSubscription(accountId, { id: "sub_2", mrr: 0, customer: "cus_loyal" });
    await addSubscription(accountId, { id: "sub_3", mrr: 1000, customer: "cus_loyal" });
    await addMovement(accountId, {
      subscription: "sub_1",
      customer: "cus_loyal",
      kind: "new",
      amount: 1000,
      at: "2026-01-05T00:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_2",
      customer: "cus_loyal",
      kind: "new",
      amount: 500,
      at: "2026-01-05T00:00:00Z",
    });
    // Drops an add-on and takes another: still a paying customer, not a new one.
    await addMovement(accountId, {
      subscription: "sub_2",
      customer: "cus_loyal",
      kind: "churn",
      amount: -500,
      at: "2026-03-03T00:00:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_3",
      customer: "cus_loyal",
      kind: "new",
      amount: 1000,
      at: "2026-03-04T00:00:00Z",
    });

    const { metrics } = await displayOf([accountId]);

    expect(metrics.thisMonth).toMatchObject({ new: 1000, churn: -500, newCustomers: 0 });
  });

  it("counts days and months in the screen's time zone", async () => {
    const accountId = await readyAccount();
    await addPayment(accountId, { amount: 100, at: "2026-03-14T22:30:00Z" });
    await addPayment(accountId, { amount: 200, at: "2026-03-14T23:30:00Z" });
    await addSubscription(accountId, { id: "sub_1", mrr: 3000 });
    await addMovement(accountId, {
      subscription: "sub_1",
      kind: "new",
      amount: 1000,
      at: "2026-02-28T23:30:00Z",
    });
    await addMovement(accountId, {
      subscription: "sub_1",
      kind: "expansion",
      amount: 2000,
      at: "2026-03-01T06:00:00Z",
    });
    const at = (iso: string) => ({ now: new Date(iso) });

    // 00:30 and 23:30 on each side of midnight in Paris (UTC+1), both the day before in UTC.
    const paris = await displayOf(
      [accountId],
      { timeZone: "Europe/Paris" },
      at("2026-03-15T09:00:00Z"),
    );
    expect(paris.metrics.revenue).toMatchObject({ today: 200, yesterday: 100 });
    const utc = await displayOf([accountId], { timeZone: "UTC" }, at("2026-03-15T09:00:00Z"));
    expect(utc.metrics.revenue).toMatchObject({ today: 0, yesterday: 300 });

    // 23:30 UTC on the last day of February is already March in Paris, not in New York.
    expect(paris.metrics.thisMonth).toMatchObject({ new: 1000, expansion: 2000 });
    const newYork = await displayOf(
      [accountId],
      { timeZone: "America/New_York" },
      at("2026-03-15T09:00:00Z"),
    );
    expect(newYork.metrics.thisMonth).toMatchObject({ new: 0, expansion: 2000 });
  });

  it("buckets days like browsers in every time zone a screen accepts", async () => {
    // 20:00 UTC is already the next day from UTC+04:00 on.
    const instant = new Date("2026-01-01T20:00:00Z");
    // MySQL knows the zones its time zone tables were loaded with: every one the editor offers,
    // and the aliases browsers may report, must be there.
    const zones = [
      ...Intl.supportedValuesOf("timeZone"),
      "UTC",
      "Asia/Calcutta",
      "Etc/GMT+5",
      "Etc/GMT-14",
      "+05:30",
      "-03:00",
    ].filter(isTimeZone);

    const rows = await db()
      .select({
        zone: sql<string>`zone`,
        day: sql<string>`date_format(convert_tz(${instant}, '+00:00', zone), '%Y-%m-%d')`,
      })
      .from(
        sql`json_table(${JSON.stringify(zones)}, '$[*]' columns (zone text path '$')) as zones`,
      );

    expect(Object.fromEntries(rows.map(({ zone, day }) => [zone, day]))).toEqual(
      Object.fromEntries(zones.map((zone) => [zone, calendarDay(instant, zone)])),
    );
  });

  it("compares revenue with the same days of the previous month, net of refunds", async () => {
    const accountId = await readyAccount();
    await addPayment(accountId, { amount: 1000, at: "2026-02-10T12:00:00Z" });
    await addPayment(accountId, { amount: 2000, at: "2026-02-15T23:00:00Z" });
    await addPayment(accountId, { amount: 4000, at: "2026-02-16T00:30:00Z" });
    await addPayment(accountId, { amount: 500, at: "2026-03-01T00:30:00Z" });
    await addPayment(accountId, { amount: 1000, refunded: 400, at: "2026-03-10T12:00:00Z" });
    await addPayment(accountId, { amount: 250, at: "2026-03-15T08:00:00Z" });

    const { metrics } = await displayOf([accountId]);

    expect(metrics.revenue).toEqual({
      today: 250,
      yesterday: 0,
      monthToDate: 500 + 600 + 250,
      previousMonthToDate: 1000 + 2000,
    });
  });

  it("converts other currencies at today's rate and says which ones it cannot", async () => {
    const euros = await readyAccount("Euro shop", { defaultCurrency: "eur" });
    const yen = await readyAccount("Tokyo shop", { defaultCurrency: "jpy" });
    await addSubscription(euros, { id: "sub_eur", mrr: 1000, currency: "eur" });
    await addMovement(euros, {
      subscription: "sub_eur",
      kind: "new",
      amount: 1000,
      currency: "eur",
      at: "2026-03-02T00:00:00Z",
    });
    await addPayment(euros, {
      amount: 500,
      currency: "eur",
      at: "2026-03-14T12:00:00Z",
      origin: "live",
    });
    await addSubscription(yen, { id: "sub_jpy", mrr: 5000, currency: "jpy" });
    // One dollar buys 0.8 euro: one euro is worth 1.25 dollars. No rate for the yen.
    const rates: Record<string, Record<string, number>> = { usd: { eur: 0.8 } };
    const rateSource: RateSource = async (base) => rates[base] ?? {};

    const state = await displayOf([euros, yen], { currency: "usd" }, { rateSource });

    expect(state.metrics.mrr).toBe(1250);
    expect(state.metrics.revenue.today).toBe(0);
    expect(state.metrics.revenue.yesterday).toBe(625);
    expect(state.feed[0]).toMatchObject({
      kind: "payment",
      amount: 625,
      original: { amount: 500, currency: "eur" },
    });
    expect(state.warnings).toEqual([
      "Amounts in JPY are left out: no exchange rate is available right now.",
    ]);
  });

  it("keeps showing amounts with stale rates when the rate source fails", async () => {
    const euros = await readyAccount("Euro shop");
    await addSubscription(euros, { id: "sub_eur", mrr: 1000, currency: "eur" });
    await displayOf([euros], { currency: "usd" }, { rateSource: async () => ({ eur: 0.8 }) });

    const later = { now: new Date(NOW.getTime() + 24 * 3600 * 1000) };
    const failing = async () => {
      throw new Error("Service unavailable");
    };
    const { token } = await createScreen(workspaceId, {
      accountIds: [euros],
      settings: { currency: "usd" },
    });
    const state = await getDisplayStateByToken(token, { ...later, rateSource: failing });

    expect(state?.metrics.mrr).toBe(1250);
    expect(state?.warnings).toEqual([]);
  });

  it("lists the latest activity with stable ids, live flags and net amounts", async () => {
    const accountId = await readyAccount();
    const imported = await addPayment(accountId, { amount: 4900, at: "2026-03-14T10:00:00Z" });
    const live = await addPayment(accountId, {
      amount: 2900,
      refunded: 900,
      at: "2026-03-15T10:00:00Z",
      origin: "live",
    });
    await addPayment(accountId, {
      amount: 1500,
      refunded: 1500,
      at: "2026-03-15T11:00:00Z",
      origin: "live",
    });
    const movement = await addMovement(accountId, {
      subscription: "sub_1",
      kind: "new",
      amount: 2900,
      at: "2026-03-15T09:00:00Z",
      origin: "live",
    });

    const { feed } = await displayOf([accountId]);

    expect(feed).toEqual([
      {
        id: `payment:${live}`,
        kind: "payment",
        amount: 2000,
        original: null,
        occurredAt: "2026-03-15T10:00:00.000Z",
        live: true,
        customerKey: null,
        customerName: null,
        country: "US",
        planName: null,
        accountName: "Acme",
      },
      expect.objectContaining({
        id: `movement:${movement}`,
        kind: "new",
        amount: 2900,
        live: true,
        planName: "Pro",
      }),
      expect.objectContaining({ id: `payment:${imported}`, live: false }),
    ]);
  });

  it("merges the latest activity of every account, newest first", async () => {
    const acme = await readyAccount("Acme");
    const beta = await readyAccount("Beta");
    // Acme sells on even minutes and Beta on odd ones, then Beta records an upgrade.
    for (let minute = 0; minute < 30; minute += 1) {
      await addPayment(minute % 2 ? beta : acme, {
        amount: 100 + minute,
        at: new Date(Date.UTC(2026, 2, 15, 10, minute)).toISOString(),
      });
    }
    await addMovement(beta, {
      subscription: "sub_1",
      kind: "expansion",
      amount: 1000,
      at: "2026-03-15T11:00:00Z",
    });

    const { feed } = await displayOf([acme, beta]);

    const latestPayments = Array.from({ length: 19 }, (_, index) => {
      const minute = 29 - index;
      return [minute % 2 ? "Beta" : "Acme", 100 + minute];
    });
    expect(feed.map((item) => [item.accountName, item.amount])).toEqual([
      ["Beta", 1000],
      ...latestPayments,
    ]);
  });

  it("describes a payment's customer as their subscription does, not as their card", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, {
      id: "sub_1",
      mrr: 4900,
      customer: "cus_1",
      customerName: "Sakura Labs",
      country: "JP",
    });
    // The charge only knows the card, issued in the United States to Grace Hopper.
    await addPayment(accountId, { amount: 4900, at: "2026-03-15T10:00:00Z", customer: "cus_1" });
    await addPayment(accountId, { amount: 1200, at: "2026-03-14T10:00:00Z" });

    const { feed } = await displayOf([accountId], { showCustomerNames: true });

    expect(feed.map(({ customerName, country }) => ({ customerName, country }))).toEqual([
      { customerName: "Sakura Labs", country: "JP" },
      { customerName: "Grace Hopper", country: "US" },
    ]);
  });

  it("names the plan a payment pays for after the customer's main subscription", async () => {
    const accountId = await readyAccount();
    await addSubscription(accountId, {
      id: "sub_addon",
      mrr: 900,
      customer: "cus_1",
      plan: "Seats",
    });
    await addSubscription(accountId, { id: "sub_main", mrr: 4900, customer: "cus_1", plan: "Pro" });
    await addPayment(accountId, { amount: 5800, at: "2026-03-15T10:00:00Z", customer: "cus_1" });
    await addPayment(accountId, { amount: 1200, at: "2026-03-14T10:00:00Z" });

    const { feed } = await displayOf([accountId]);

    expect(feed.map((item) => item.planName)).toEqual(["Pro", null]);
  });

  it("tells which items are the same customer's, without revealing who", async () => {
    const accountId = await readyAccount();
    await addMovement(accountId, {
      subscription: "sub_1",
      customer: "cus_ada",
      kind: "new",
      amount: 4900,
      at: "2026-03-15T10:00:00Z",
    });
    await addPayment(accountId, { amount: 4900, at: "2026-03-15T10:01:00Z", customer: "cus_ada" });
    await addPayment(accountId, { amount: 900, at: "2026-03-15T10:02:00Z", customer: "cus_bob" });

    const { feed } = await displayOf([accountId]);

    const [bob, adaPaid, adaSubscribed] = feed.map((item) => item.customerKey);
    expect(adaPaid).toBe(adaSubscribed);
    expect(bob).not.toBe(adaPaid);
    expect(JSON.stringify(feed)).not.toContain("cus_");
  });

  it("only shows customer names when the screen allows it", async () => {
    const accountId = await readyAccount();
    await addPayment(accountId, { amount: 4900, at: "2026-03-14T10:00:00Z" });

    expect((await displayOf([accountId])).feed[0].customerName).toBeNull();
    expect((await displayOf([accountId], { showCustomerNames: true })).feed[0].customerName).toBe(
      "Grace Hopper",
    );
  });

  it("is in error only when every account fails", async () => {
    const working = await readyAccount("Working");
    const failing = await readyAccount("Failing", {
      status: "error",
      lastError: "This Stripe key was revoked or rolled. Connect the account again with a new key.",
    });
    const importing = await readyAccount("New", { status: "importing" });

    const mixed = await displayOf([working, failing]);
    expect(mixed.status).toBe("ready");
    expect(mixed.warnings).toEqual([
      "Failing: This Stripe key was revoked or rolled. Connect the account again with a new key.",
    ]);
    expect((await displayOf([failing])).status).toBe("error");
    expect((await displayOf([working, importing])).status).toBe("importing");
  });

  it("announces a recent test celebration", async () => {
    const recent = new Date(NOW.getTime() - 5 * 60 * 1000);
    const { token } = await createScreen(workspaceId, { testEventAt: recent });
    expect((await getDisplayStateByToken(token, { now: NOW }))?.testEvent).toEqual({
      id: recent.toISOString(),
    });

    const old = await createScreen(workspaceId, {
      testEventAt: new Date(NOW.getTime() - 11 * 60 * 1000),
    });
    expect((await getDisplayStateByToken(old.token, { now: NOW }))?.testEvent).toBeNull();
  });

  it("only reads the linked accounts", async () => {
    const shown = await readyAccount("Shown");
    const other = await readyAccount("Other", { stripeAccountId: "acct_other" });
    await addSubscription(shown, { id: "sub_1", mrr: 1000 });
    await addSubscription(other, { id: "sub_2", mrr: 9000 });

    expect((await displayOf([shown])).metrics.mrr).toBe(1000);
    await db().delete(stripeAccounts).where(eq(stripeAccounts.id, shown));
    expect((await displayOf([])).metrics.mrr).toBe(0);
  });
});

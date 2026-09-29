import { describe, expect, it } from "vitest";
import { displayCalendar } from "@/lib/display/calendar";
import {
  displayStatus,
  firstDay,
  metricsOf,
  movementTotals,
  mrrHistory,
  revenueMetrics,
  type AccountFigures,
} from "./metrics";

describe("MRR history", () => {
  it("starts on the day of the first change", () => {
    expect(
      firstDay([
        { day: "2026-03-14", amount: 2000 },
        { day: "2024-11-02", amount: 500 },
        { day: "2025-01-20", amount: -500 },
      ]),
    ).toBe("2024-11-02");
    expect(firstDay([])).toBeNull();
  });

  it("walks back from the current MRR, one day of changes at a time", () => {
    const history = mrrHistory(
      8000,
      [
        { day: "2026-03-14", amount: 2000 },
        { day: "2026-03-14", amount: -500 },
        { day: "2026-03-12", amount: 1000 },
      ],
      ["2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14", "2026-03-15"],
    );
    expect(history).toEqual([
      { date: "2026-03-11", value: 5500 },
      { date: "2026-03-12", value: 6500 },
      { date: "2026-03-13", value: 6500 },
      { date: "2026-03-14", value: 8000 },
      { date: "2026-03-15", value: 8000 },
    ]);
  });
});

describe("revenue", () => {
  it("adds daily revenue into today, this month and the comparable days of last month", () => {
    const calendar = displayCalendar("2026-03-15");
    const revenue = revenueMetrics(
      [
        { day: "2026-02-15", amount: 100 },
        { day: "2026-02-16", amount: 1000 },
        { day: "2026-03-14", amount: 20 },
        { day: "2026-03-15", amount: 3 },
      ],
      calendar,
    );
    expect(revenue).toEqual({
      today: 3,
      yesterday: 20,
      monthToDate: 23,
      previousMonthToDate: 100,
    });
  });
});

describe("movement totals", () => {
  it("sums each kind since the start of the month", () => {
    expect(
      movementTotals(
        [
          { day: "2026-02-28", kind: "new", amount: 9999 },
          { day: "2026-03-01", kind: "new", amount: 1000 },
          { day: "2026-03-02", kind: "churn", amount: -400 },
        ],
        "2026-03-01",
      ),
    ).toEqual({ new: 1000, expansion: 0, reactivation: 0, contraction: 0, churn: -400, net: 600 });
  });
});

describe("metrics of accounts", () => {
  const calendar = displayCalendar("2026-03-15");
  const figures: AccountFigures = {
    subscriptions: [
      { accountId: "acme", mrr: 3000, trialing: 1 },
      // Acme also bills in another currency, already converted.
      { accountId: "acme", mrr: 1000, trialing: 0 },
      { accountId: "beta", mrr: 2000, trialing: 2 },
    ],
    movements: [
      { accountId: "acme", day: "2026-03-10", kind: "new", amount: 1000 },
      { accountId: "beta", day: "2026-01-05", kind: "new", amount: 2000 },
    ],
    revenue: [
      { accountId: "acme", day: "2026-03-15", amount: 500 },
      { accountId: "beta", day: "2026-03-14", amount: 300 },
    ],
    payingCustomers: new Map([
      ["acme", 3],
      ["beta", 1],
    ]),
    newCustomers: new Map([["acme", 1]]),
    customersCreatedToday: new Map([
      ["acme", 2],
      ["beta", 5],
    ]),
  };
  const of = (accountId: string) => (id: string) => id === accountId;

  it("gives each account its own numbers", () => {
    const acme = metricsOf(figures, of("acme"), calendar, "30d");
    const beta = metricsOf(figures, of("beta"), calendar, "30d");

    expect(acme.metrics).toMatchObject({
      mrr: 4000,
      mrr30DaysAgo: 3000,
      activeCustomers: 3,
      arpu: 1333,
      trialingSubscriptions: 1,
      customersCreatedToday: 2,
      revenue: { today: 500, yesterday: 0 },
      thisMonth: { new: 1000, net: 1000, newCustomers: 1 },
    });
    expect(beta.metrics).toMatchObject({
      mrr: 2000,
      mrr30DaysAgo: 2000,
      activeCustomers: 1,
      arpu: 2000,
      customersCreatedToday: 5,
      revenue: { today: 0, yesterday: 300 },
      thisMonth: { new: 0, newCustomers: 0 },
    });
  });

  it("adds up the numbers of every account for the screen", () => {
    const screen = metricsOf(figures, () => true, calendar, "30d");
    const acme = metricsOf(figures, of("acme"), calendar, "30d");
    const beta = metricsOf(figures, of("beta"), calendar, "30d");

    expect(screen.metrics).toMatchObject({
      mrr: 6000,
      mrr30DaysAgo: 5000,
      activeCustomers: 4,
      // Averaged over every paying customer, not the average of each account's.
      arpu: 1500,
      trialingSubscriptions: 3,
      customersCreatedToday: 7,
      revenue: { today: 500, yesterday: 300 },
      thisMonth: { new: 1000, newCustomers: 1 },
    });
    expect(screen.series.mrr).toEqual(
      acme.series.mrr.map(({ date, value }, index) => ({
        date,
        value: value + beta.series.mrr[index].value,
      })),
    );
  });

  it("starts each account's all-time chart with its own first movement", () => {
    const start = (includes: (accountId: string) => boolean) =>
      metricsOf(figures, includes, calendar, "all").series.mrr[0];

    expect(start(of("acme"))).toEqual({ date: "2026-03-10", value: 4000 });
    expect(start(of("beta"))).toEqual({ date: "2026-01-05", value: 2000 });
    expect(start(() => true)).toEqual({ date: "2026-01-05", value: 5000 });
  });
});

describe("display status", () => {
  it("summarizes the linked accounts", () => {
    expect(displayStatus([])).toBe("empty");
    expect(displayStatus(["error", "error"])).toBe("error");
    expect(displayStatus(["error", "ready"])).toBe("ready");
    expect(displayStatus(["ready", "importing"])).toBe("importing");
  });
});

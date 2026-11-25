import { describe, expect, it } from "vitest";
import { DAY_MS } from "@/lib/durations";
import {
  billingIntervalOf,
  buildDailyMetricRows,
  normalizeMonthlyMrr,
  parseOverviewMetrics,
  toUtcDay,
} from "./charts";

describe("toUtcDay", () => {
  it("normalizes unix seconds, unix ms, and ISO strings to UTC YYYY-MM-DD", () => {
    expect(toUtcDay(1735689600)).toBe("2025-01-01");
    expect(toUtcDay(1735689600000)).toBe("2025-01-01");
    expect(toUtcDay("2025-03-15")).toBe("2025-03-15");
    expect(toUtcDay("2025-03-15T12:30:00Z")).toBe("2025-03-15");
    expect(toUtcDay(null)).toBeNull();
  });
});

describe("parseOverviewMetrics", () => {
  it("converts overview MRR to minor units and reads active counts", () => {
    const fallback = new Date("2026-01-01T00:00:00Z");
    const parsed = parseOverviewMetrics(
      {
        currency: "EUR",
        metrics: [
          { id: "mrr", value: 4270.55, last_updated_at: 1767225600000 },
          { id: "active_subscriptions", value: 184, last_updated_at: 1767225500000 },
          { id: "active_trials", value: 23, last_updated_at: 1767225400000 },
        ],
      },
      fallback,
    );

    expect(parsed).toEqual({
      currency: "eur",
      mrr: 427055,
      activeSubscriptions: 184,
      activeTrials: 23,
      updatedAt: new Date(1767225600000),
    });
  });

  it("handles zero-decimal currencies such as JPY", () => {
    const parsed = parseOverviewMetrics(
      { currency: "JPY", metrics: [{ id: "mrr", value: 125000 }] },
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(parsed.currency).toBe("jpy");
    expect(parsed.mrr).toBe(125000);
  });
});

describe("buildDailyMetricRows", () => {
  it("merges Charts v3 object points across mrr_movement, revenue, actives_new, and customers_new", () => {
    const day1 = Date.UTC(2026, 10, 20) / 1000;
    const day2 = Date.UTC(2026, 10, 21) / 1000;

    const rows = buildDailyMetricRows({
      currency: "usd",
      mrrMovement: {
        currency: "usd",
        resolution: "day",
        measures: [
          { displayName: "New MRR", unit: "$", chartable: true },
          { displayName: "Resubscription MRR", unit: "$", chartable: true },
          { displayName: "Expansion MRR", unit: "$", chartable: true },
          { displayName: "Contraction MRR", unit: "$", chartable: true },
          { displayName: "Churned MRR", unit: "$", chartable: true },
        ],
        values: [
          { cohort: day1, measure: 0, value: 120.5 },
          { cohort: day1, measure: 1, value: 15 },
          { cohort: day1, measure: 2, value: 10 },
          { cohort: day1, measure: 3, value: 5 },
          { cohort: day1, measure: 4, value: 40.25 },
          { cohort: day2, measure: 0, value: 50 },
        ],
      },
      revenue: {
        currency: "usd",
        resolution: "day",
        measures: [
          { displayName: "Revenue", unit: "$", chartable: true },
          { displayName: "Transactions", unit: "#", chartable: false },
        ],
        values: [
          { cohort: day1, measure: 0, value: 300.1 },
          { cohort: day1, measure: 1, value: 12 },
          { cohort: day2, measure: 0, value: 99.99 },
        ],
      },
      activesNew: {
        currency: "usd",
        resolution: "day",
        measures: [{ displayName: "New Paid Subscriptions", unit: "#", chartable: true }],
        values: [
          [day1, 6],
          [day2, 2],
        ],
      },
      customersNew: {
        currency: "usd",
        resolution: "day",
        measures: [{ displayName: "New Customers", unit: "#", chartable: true }],
        values: [[day2, 42]],
      },
    });

    expect(rows).toEqual([
      {
        day: "2026-11-20",
        currency: "usd",
        revenue: 30010,
        mrrNew: 12050,
        mrrReactivation: 1500,
        mrrExpansion: 1000,
        mrrContraction: -500,
        mrrChurn: -4025,
        newPayingCustomers: 6,
        newCustomers: 0,
      },
      {
        day: "2026-11-21",
        currency: "usd",
        revenue: 9999,
        mrrNew: 5000,
        mrrReactivation: 0,
        mrrExpansion: 0,
        mrrContraction: -0,
        mrrChurn: -0,
        newPayingCustomers: 2,
        newCustomers: 42,
      },
    ]);
  });
});

describe("normalizeMonthlyMrr", () => {
  it("normalizes ISO 8601 durations to monthly MRR", () => {
    expect(normalizeMonthlyMrr(12000, "P1Y")).toBe(1000);
    expect(normalizeMonthlyMrr(1000, "P1M")).toBe(1000);
    expect(normalizeMonthlyMrr(3000, "P3M")).toBe(1000);
    expect(normalizeMonthlyMrr(6000, "P6M")).toBe(1000);
    expect(normalizeMonthlyMrr(1000, "P1W")).toBe(Math.round((1000 * 52) / 12));
  });

  it("falls back to period length in ms when product duration is missing", () => {
    expect(normalizeMonthlyMrr(12000, null, 365 * DAY_MS)).toBe(1000);
    expect(normalizeMonthlyMrr(1000, null, 30 * DAY_MS)).toBe(1000);
    expect(billingIntervalOf(null, 7 * DAY_MS)).toBe("week");
    expect(billingIntervalOf("P1Y")).toBe("year");
  });
});

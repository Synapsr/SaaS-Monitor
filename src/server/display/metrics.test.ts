import { describe, expect, it } from "vitest";
import { displayCalendar } from "@/lib/display/calendar";
import { displayStatus, movementTotals, mrrHistory, revenueMetrics } from "./metrics";

describe("MRR history", () => {
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
    const { revenue, series } = revenueMetrics(
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
      last30Days: 1123,
    });
    expect(series.at(-1)).toEqual({ date: "2026-03-15", value: 3 });
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

describe("display status", () => {
  it("summarises the linked accounts", () => {
    expect(displayStatus([])).toBe("empty");
    expect(displayStatus(["error", "error"])).toBe("error");
    expect(displayStatus(["error", "ready"])).toBe("ready");
    expect(displayStatus(["ready", "importing"])).toBe("importing");
  });
});

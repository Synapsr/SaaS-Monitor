import { describe, expect, it } from "vitest";
import { addDays, chartDays } from "@/lib/display/calendar";
import { chartRangeLabel, layoutMrrChart, nearestPoint } from "@/lib/display/chart";

const series = Array.from({ length: 91 }, (_, index) => ({
  date: addDays("2026-06-30", index),
  value: 900_000 + index * 6_000,
}));
const options = { series, currency: "usd", width: 1180, height: 260, fontSize: 16 };

/** A growing MRR over all time since `historyStart`, sampled like a screen's. */
function allTime(historyStart: string) {
  return chartDays("2026-09-28", "all", historyStart).map((date, index) => ({
    date,
    value: 100_000 + index * 4_000,
  }));
}

describe("MRR chart layout", () => {
  it("draws the curve right of the label gutter, across the whole width", () => {
    const layout = layoutMrrChart({ ...options, target: 2_500_000 });
    expect(layout.gutter).toBeGreaterThan(0);
    expect(layout.x(layout.points[0].date)).toBe(layout.gutter);
    expect(layout.x(layout.points[90].date)).toBe(1180);
    expect(layout.linePath.startsWith("M")).toBe(true);
  });

  it("labels months on long ranges, with round values on the side", () => {
    const layout = layoutMrrChart({ ...options, target: 2_500_000 });
    expect(layout.xTicks.map((tick) => tick.label)).toEqual(["Jul", "Aug", "Sep"]);
    expect(layout.yTicks.map((tick) => tick.label)).toEqual(["$6K", "$8K", "$10K", "$12K", "$14K"]);
  });

  it("writes close values with the decimals that tell them apart", () => {
    // ARR from $1M to $1.1M: in compact amounts with one decimal, most ticks would read "$1.1M".
    const arr = series.map((point, index) => ({ ...point, value: 100_000_000 + index * 111_111 }));
    const labels = layoutMrrChart({ ...options, series: arr, target: 500_000_000 }).yTicks.map(
      (tick) => tick.label,
    );
    expect(labels).toEqual(["$950K", "$1M", "$1.05M", "$1.1M"]);
  });

  it("labels a month with weekly dates, all inside the plot", () => {
    const layout = layoutMrrChart({ ...options, series: series.slice(-31), target: 2_500_000 });
    expect(layout.xTicks.map((tick) => tick.label)).toEqual([
      "Aug 31",
      "Sep 7",
      "Sep 14",
      "Sep 21",
    ]);
    const halfLabel = (16 * 5.5) / 2;
    for (const tick of layout.xTicks) {
      expect(tick.x - halfLabel).toBeGreaterThanOrEqual(0);
      expect(tick.x + halfLabel).toBeLessThanOrEqual(1180);
    }
  });

  it("labels quarters over two years of weekly points", () => {
    const layout = layoutMrrChart({ ...options, series: allTime("2024-09-01"), target: 1 });
    expect(layout.xTicks.map((tick) => tick.label)).toEqual([
      "Oct",
      "Jan 2025",
      "Apr",
      "Jul",
      "Oct",
      "Jan 2026",
      "Apr",
      "Jul",
    ]);
  });

  it("labels years over a longer history", () => {
    const weekly = layoutMrrChart({ ...options, series: allTime("2022-05-08"), target: 1 });
    expect(weekly.xTicks.map((tick) => tick.label)).toEqual(["2023", "2024", "2025", "2026"]);
    const monthly = layoutMrrChart({ ...options, series: allTime("2013-02-11"), target: 1 });
    expect(monthly.xTicks.map((tick) => tick.label)).toEqual([
      "2014",
      "2016",
      "2018",
      "2020",
      "2022",
      "2024",
      "2026",
    ]);
  });

  it("uses fewer ticks when there is less room", () => {
    const month = { ...options, series: series.slice(-31), target: 2_500_000 };
    expect(layoutMrrChart({ ...month, width: 300 }).xTicks.length).toBeLessThan(
      layoutMrrChart(month).xTicks.length,
    );
    expect(layoutMrrChart({ ...month, height: 110 }).yTicks.length).toBeLessThan(
      layoutMrrChart(month).yTicks.length,
    );
  });

  it("draws the goal as a horizon when it is within sight", () => {
    expect(layoutMrrChart({ ...options, target: 1_500_000 }).horizon?.label).toBe("$15K");
    expect(layoutMrrChart({ ...options, target: 2_500_000 }).horizon).toBeNull();
  });

  it("finds the point nearest to the pointer, however far apart points are", () => {
    // Sundays, then today: a Monday, one day after the last Sunday.
    const layout = layoutMrrChart({ ...options, series: allTime("2024-09-01"), target: 1 });
    const { points, x } = layout;
    const last = points.length - 1;

    expect(nearestPoint(layout, 0)).toBe(0);
    expect(nearestPoint(layout, x(points[40].date) + 1)).toBe(40);
    expect(nearestPoint(layout, x(points[40].date) - 1)).toBe(40);
    expect(nearestPoint(layout, (x(points[last - 1].date) + 3 * x(points[last].date)) / 4)).toBe(
      last,
    );
    expect(nearestPoint(layout, 5_000)).toBe(last);
  });
});

describe("chart range label", () => {
  it("names a range of a fixed length, or all time from its first day", () => {
    expect(chartRangeLabel("90d", "2026-06-30")).toBe("last 90 days");
    expect(chartRangeLabel("12m", "2025-09-28")).toBe("last 12 months");
    expect(chartRangeLabel("all", "2022-05-08")).toBe("since May 2022");
  });
});

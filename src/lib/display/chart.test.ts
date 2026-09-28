import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/display/calendar";
import { layoutMrrChart } from "@/lib/display/chart";

const series = Array.from({ length: 91 }, (_, index) => ({
  date: addDays("2026-06-30", index),
  value: 900_000 + index * 6_000,
}));
const options = { series, currency: "usd", monthly: true, width: 1180, height: 260, fontSize: 16 };

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

  it("labels a month with weekly dates, all inside the plot", () => {
    const month = { ...options, series: series.slice(-31), target: 2_500_000, monthly: false };
    const layout = layoutMrrChart(month);
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

  it("uses fewer ticks when there is less room", () => {
    const month = { ...options, series: series.slice(-31), target: 2_500_000, monthly: false };
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
});

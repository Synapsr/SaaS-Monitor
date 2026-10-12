import { describe, expect, it } from "vitest";
import { sample, sparkline } from "@/lib/display/sparkline";

const BOX = { width: 100, height: 40 };

describe("sparkline", () => {
  it("needs two values to draw a curve", () => {
    expect(sparkline([], BOX)).toBeNull();
    expect(sparkline([1_000], BOX)).toBeNull();
  });

  it("spans the box from left to right, and ends on the newest value", () => {
    const curve = sparkline([1_000, 1_200, 1_500], BOX)!;
    expect(curve.line.startsWith("M0,")).toBe(true);
    expect(curve.end.x).toBe(100);
    // The highest value sits below the top, with headroom like the wall chart's.
    expect(curve.end.y).toBeGreaterThan(0);
    expect(curve.end.y).toBeLessThan(20);
  });

  it("keeps a growing curve off the floor", () => {
    const curve = sparkline([1_000, 1_200, 1_500], BOX)!;
    const firstY = Number(/^M0,([\d.]+)/.exec(curve.line)?.[1]);
    expect(firstY).toBeLessThan(BOX.height);
  });

  it("closes its fill down to the bottom edge", () => {
    const curve = sparkline([1_000, 1_500], BOX)!;
    expect(curve.area).toContain(`L100,${BOX.height}`);
    expect(curve.area).toContain(`L0,${BOX.height}`);
  });

  it("draws a flat history as a level line", () => {
    const curve = sparkline([5_000, 5_000, 5_000], BOX)!;
    // Coordinates come in pairs, x then y.
    const heights = (curve.line.match(/[\d.]+/g) ?? [])
      .map(Number)
      .filter((_, index) => index % 2 === 1);
    expect(new Set(heights).size).toBe(1);
    expect(curve.end.y).toBeCloseTo((heights[0] / BOX.height) * 100);
    expect(curve.end.y).toBeGreaterThan(0);
  });
});

describe("sample", () => {
  it("keeps short series as they are", () => {
    expect(sample([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });

  it("thins long series evenly, keeping the first and the last value", () => {
    const values = Array.from({ length: 91 }, (_, index) => index);
    const sampled = sample(values, 31);
    expect(sampled).toHaveLength(31);
    expect(sampled[0]).toBe(0);
    expect(sampled.at(-1)).toBe(90);
    expect(sampled[1]).toBe(3);
  });
});

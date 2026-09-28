import { describe, expect, it } from "vitest";
import { recurringMetric } from "@/lib/display/metric";
import {
  crossedMilestone,
  goalProgress,
  milestonesBetween,
  nextMilestone,
} from "@/lib/display/milestones";

const now = new Date("2026-09-28T12:00:00Z");

/** Recurring revenue (minor units) now and 30 days ago. */
const value = (current: number, thirtyDaysAgo: number) => ({ current, thirtyDaysAgo });

describe("milestone ladder", () => {
  it("follows the 1 – 2.5 – 5 steps from $100", () => {
    expect(milestonesBetween(0, 1_000_000)).toEqual([
      100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000,
      1_000_000,
    ]);
  });

  it("keeps growing by ×2.5 and ×2 after a million", () => {
    expect(milestonesBetween(1_000_000, 100_000_000)).toEqual([
      2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000,
    ]);
  });

  it("finds the next milestone strictly above a value", () => {
    expect(nextMilestone(0)).toBe(100);
    expect(nextMilestone(99.99)).toBe(100);
    expect(nextMilestone(100)).toBe(250);
    expect(nextMilestone(14_681)).toBe(25_000);
    expect(nextMilestone(3_000_000)).toBe(5_000_000);
  });
});

describe("goal progress", () => {
  it("heads for the next ladder milestone without a goal", () => {
    const progress = goalProgress(value(1_468_100, 1_253_500), null, "usd", now);
    expect(progress).toMatchObject({ kind: "milestone", target: 2_500_000, remaining: 1_031_900 });
    expect(progress.progress).toBeCloseTo(0.587, 3);
  });

  it("heads for the custom goal while it is ahead", () => {
    const progress = goalProgress(value(1_468_100, 1_253_500), 15_000, "usd", now);
    expect(progress).toMatchObject({ kind: "goal", target: 1_500_000, remaining: 31_900 });
  });

  it("falls back to the ladder once the goal is reached", () => {
    const progress = goalProgress(value(1_600_000, 1_400_000), 15_000, "usd", now);
    expect(progress).toMatchObject({ kind: "milestone", target: 2_500_000 });
  });

  it("estimates when the target is reached at the 30-day pace", () => {
    // +$3,000 in 30 days is $100 a day: $2,000 to go takes 20 days.
    const progress = goalProgress(value(800_000, 500_000), null, "usd", now);
    expect(progress.remaining).toBe(200_000);
    expect(progress.eta?.toISOString()).toBe("2026-10-18T12:00:00.000Z");
  });

  it("gives no estimate when MRR is flat or shrinking", () => {
    expect(goalProgress(value(800_000, 800_000), null, "usd", now).eta).toBeNull();
    expect(goalProgress(value(800_000, 900_000), null, "usd", now).eta).toBeNull();
  });

  it("gives no estimate beyond ten years", () => {
    expect(goalProgress(value(800_000, 799_999), null, "usd", now).eta).toBeNull();
  });

  it("climbs the ladder of ARR on a screen showing it, with the same estimate as in MRR", () => {
    const { fromMrr } = recurringMetric("arr");

    // $96K of ARR heads for $100K of ARR, not for the next step of the MRR ladder.
    const progress = goalProgress(value(fromMrr(800_000), fromMrr(500_000)), null, "usd", now);
    expect(progress).toMatchObject({ kind: "milestone", target: 10_000_000, remaining: 400_000 });
    // $4,000 of ARR to go at $1,200 a day, like $333.33 of MRR at $100 a day: 3 days and 8 hours.
    expect(progress.eta?.toISOString()).toBe("2026-10-01T20:00:00.000Z");
  });

  it("reads a custom goal in the screen's metric", () => {
    // $176,172 of ARR, and a goal of $250K of ARR.
    expect(goalProgress(value(17_617_200, 15_042_000), 250_000, "usd", now)).toMatchObject({
      kind: "goal",
      target: 25_000_000,
      remaining: 7_382_800,
    });
  });

  it("works in zero-decimal currencies", () => {
    const progress = goalProgress(value(2_000_000, 1_000_000), null, "jpy", now);
    expect(progress).toMatchObject({ target: 2_500_000, remaining: 500_000 });
  });
});

describe("crossed milestones", () => {
  it("detects a ladder milestone, landing exactly on it included", () => {
    expect(crossedMilestone(990_000, 1_004_900, null, "usd")).toBe(1_000_000);
    expect(crossedMilestone(999_999, 1_000_000, null, "usd")).toBe(1_000_000);
  });

  it("detects the custom goal", () => {
    expect(crossedMilestone(1_490_000, 1_509_900, 15_000, "usd")).toBe(1_500_000);
  });

  it("keeps only the highest milestone of a big jump", () => {
    expect(crossedMilestone(900_000, 2_600_000, 15_000, "usd")).toBe(2_500_000);
  });

  it("detects round numbers of ARR on a screen showing ARR", () => {
    const { fromMrr } = recurringMetric("arr");
    // $20,800 → $20,850 of MRR crosses no milestone of MRR, but $250K of ARR.
    expect(crossedMilestone(2_080_000, 2_085_000, null, "usd")).toBeNull();
    expect(crossedMilestone(fromMrr(2_080_000), fromMrr(2_085_000), null, "usd")).toBe(25_000_000);
    // $83,000 → $83,500 of MRR: $1M of ARR.
    expect(crossedMilestone(fromMrr(8_300_000), fromMrr(8_350_000), null, "usd")).toBe(100_000_000);
  });

  it("ignores decreases and moves between two milestones", () => {
    expect(crossedMilestone(1_010_000, 990_000, null, "usd")).toBeNull();
    expect(crossedMilestone(1_010_000, 1_020_000, null, "usd")).toBeNull();
  });
});

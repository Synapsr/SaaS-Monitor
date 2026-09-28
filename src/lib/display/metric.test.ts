import { describe, expect, it } from "vitest";
import { recurringMetric } from "@/lib/display/metric";

describe("recurring metric", () => {
  it("shows MRR as it is", () => {
    const mrr = recurringMetric("mrr");
    expect(mrr).toMatchObject({ label: "MRR", name: "Monthly recurring revenue", other: "arr" });
    expect(mrr.fromMrr(1_468_100)).toBe(1_468_100);
  });

  it("shows ARR as twelve times MRR, changes and losses included", () => {
    const arr = recurringMetric("arr");
    expect(arr).toMatchObject({ label: "ARR", name: "Annual recurring revenue", other: "mrr" });
    expect(arr.fromMrr(1_468_100)).toBe(17_617_200);
    // A new subscription at $149 a month is worth $1,788 a year; a churn at $29, -$348.
    expect(arr.fromMrr(14_900)).toBe(178_800);
    expect(arr.fromMrr(-2_900)).toBe(-34_800);
  });

  it("is the same object for the same metric", () => {
    expect(recurringMetric("arr")).toBe(recurringMetric("arr"));
    expect(recurringMetric(recurringMetric("mrr").other)).toBe(recurringMetric("arr"));
  });
});

import { describe, expect, it } from "vitest";
import { parseGoal } from "./parse-goal";

describe("parseGoal", () => {
  it.each([
    ["10000", 10_000],
    ["12,500", 12_500],
    [" 12 500 ", 12_500],
    ["10k", 10_000],
    ["12.5K", 12_500],
    ["1m", 1_000_000],
  ])("reads %j as %i", (input, goal) => {
    expect(parseGoal(input)).toBe(goal);
  });

  it.each(["", "0", "-5", "abc", "12.5", "1.2345k", "10x", "2000m"])("refuses %j", (input) => {
    expect(parseGoal(input)).toBeNull();
  });
});

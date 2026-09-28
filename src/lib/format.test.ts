import { describe, expect, it } from "vitest";
import { formatApproximateDuration, formatCount, formatRelativeTime } from "./format";

const now = new Date("2026-09-28T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("formatRelativeTime", () => {
  it("reads naturally at every scale", () => {
    expect(formatRelativeTime(ago(10), now)).toBe("just now");
    expect(formatRelativeTime(ago(50), now)).toBe("1 minute ago");
    expect(formatRelativeTime(ago(3 * 60), now)).toBe("3 minutes ago");
    expect(formatRelativeTime(ago(2 * 60 * 60), now)).toBe("2 hours ago");
    expect(formatRelativeTime(ago(24 * 60 * 60), now)).toBe("yesterday");
    expect(formatRelativeTime(ago(8 * 24 * 60 * 60), now)).toBe("8 days ago");
    expect(formatRelativeTime(ago(3 * 7 * 24 * 60 * 60), now)).toBe("3 weeks ago");
    expect(formatRelativeTime(ago(90 * 24 * 60 * 60), now)).toBe("3 months ago");
  });

  it("describes future dates too", () => {
    expect(formatRelativeTime(ago(-7 * 24 * 60 * 60 + 60), now)).toBe("in 7 days");
  });
});

describe("formatApproximateDuration", () => {
  it("rounds to minutes, then hours", () => {
    expect(formatApproximateDuration(20)).toBe("~1 min");
    expect(formatApproximateDuration(480)).toBe("~8 min");
    expect(formatApproximateDuration(3600)).toBe("~1 hour");
    expect(formatApproximateDuration(3 * 3600)).toBe("~3 hours");
  });
});

describe("formatCount", () => {
  it("groups thousands", () => {
    expect(formatCount(12480)).toBe("12,480");
  });
});

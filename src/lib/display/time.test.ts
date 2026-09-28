import { describe, expect, it } from "vitest";
import {
  formatChartDay,
  formatClock,
  formatEta,
  formatMonth,
  formatFeedTime,
} from "@/lib/display/time";

const PARIS = "Europe/Paris";
const now = new Date("2026-09-28T12:00:00Z"); // Monday, 14:00 in Paris

describe("feed times", () => {
  const ago = (milliseconds: number) =>
    formatFeedTime(new Date(now.getTime() - milliseconds), now, PARIS);
  const minutes = 60_000;
  const hours = 60 * minutes;

  it("stays short for a live feed", () => {
    expect(ago(10_000)).toBe("just now");
    expect(ago(50_000)).toBe("1 min ago");
    expect(ago(12 * minutes)).toBe("12 min ago");
    expect(ago(3 * hours + 20 * minutes)).toBe("3 h ago");
  });

  it("switches to days in the screen's time zone", () => {
    expect(ago(20 * hours)).toBe("yesterday");
    expect(ago(3 * 24 * hours)).toBe("Fri");
    expect(ago(20 * 24 * hours)).toBe("Sep 8");
    expect(ago(400 * 24 * hours)).toBe("Aug 24, 2025");
  });

  it("counts hours, not days, shortly after midnight", () => {
    const earlyMorning = new Date("2026-09-28T23:30:00Z"); // 01:30 in Paris
    const lateEvening = new Date(earlyMorning.getTime() - 3 * hours);
    expect(formatFeedTime(lateEvening, earlyMorning, PARIS)).toBe("3 h ago");
  });

  it("never shows a negative time for clocks slightly ahead", () => {
    expect(ago(-30_000)).toBe("just now");
  });
});

describe("screen dates", () => {
  it("shows a 24-hour clock and the date of the screen's time zone", () => {
    expect(formatClock(now, PARIS)).toEqual({ time: "14:00", date: "Monday, September 28" });
    expect(formatClock(now, "Asia/Tokyo").time).toBe("21:00");
  });

  it("formats estimates precisely when close, by month when far", () => {
    const inDays = (days: number) => new Date(now.getTime() + days * 86_400_000);
    expect(formatEta(inDays(0.5), now, PARIS)).toBe("today");
    expect(formatEta(inDays(1.5), now, PARIS)).toBe("tomorrow");
    expect(formatEta(inDays(20), now, PARIS)).toBe("Oct 18");
    expect(formatEta(inDays(140), now, PARIS)).toBe("Feb 2027");
  });

  it("labels chart days", () => {
    expect(formatChartDay("2026-09-12", false)).toBe("Sep 12");
    expect(formatChartDay("2026-09-01", true)).toBe("Sep");
    expect(formatChartDay("2027-01-01", true)).toBe("Jan 2027");
  });

  it("names months", () => {
    expect(formatMonth("2026-08-01")).toBe("August");
  });
});

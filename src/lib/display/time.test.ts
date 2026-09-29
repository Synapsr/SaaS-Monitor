import { describe, expect, it } from "vitest";
import {
  formatAxisDate,
  formatChartDay,
  formatClock,
  formatEta,
  formatMonth,
  formatFeedTime,
} from "@/lib/display/time";
import { displayLocale } from "@/lib/display/i18n";

const en = displayLocale("en");
const fr = displayLocale("fr");
const PARIS = "Europe/Paris";
const now = new Date("2026-09-28T12:00:00Z"); // Monday, 14:00 in Paris

describe("feed times", () => {
  const ago = (milliseconds: number) =>
    formatFeedTime(new Date(now.getTime() - milliseconds), now, PARIS, en);
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
    expect(formatFeedTime(lateEvening, earlyMorning, PARIS, en)).toBe("3 h ago");
  });

  it("never shows a negative time for clocks slightly ahead", () => {
    expect(ago(-30_000)).toBe("just now");
  });

  it("speaks the screen's language", () => {
    const inFrench = (milliseconds: number) =>
      formatFeedTime(new Date(now.getTime() - milliseconds), now, PARIS, fr);
    expect(inFrench(10_000)).toBe("à l’instant");
    expect(inFrench(12 * minutes)).toBe("il y a 12 min");
    expect(inFrench(20 * hours)).toBe("hier");
    expect(inFrench(3 * 24 * hours)).toBe("ven.");
    expect(inFrench(20 * 24 * hours)).toBe("8 sept.");
  });
});

describe("screen dates", () => {
  it("shows a 24-hour clock and the date of the screen's time zone", () => {
    expect(formatClock(now, PARIS, "en-US")).toEqual({
      time: "14:00",
      date: "Monday, September 28",
    });
    expect(formatClock(now, "Asia/Tokyo", "en-US").time).toBe("21:00");
    expect(formatClock(now, PARIS, "fr-FR")).toEqual({ time: "14:00", date: "lundi 28 septembre" });
    expect(formatClock(now, PARIS, "de-DE").date).toBe("Montag, 28. September");
  });

  it("formats estimates precisely when close, by month when far", () => {
    const inDays = (days: number) => new Date(now.getTime() + days * 86_400_000);
    expect(formatEta(inDays(0.5), now, PARIS, en)).toBe("today");
    expect(formatEta(inDays(1.5), now, PARIS, en)).toBe("tomorrow");
    expect(formatEta(inDays(20), now, PARIS, en)).toBe("Oct 18");
    expect(formatEta(inDays(140), now, PARIS, en)).toBe("Feb 2027");
    expect(formatEta(inDays(1.5), now, PARIS, fr)).toBe("demain");
    expect(formatEta(inDays(140), now, PARIS, fr)).toBe("févr. 2027");
  });

  it("labels chart axes in days, months or years", () => {
    expect(formatAxisDate("2026-09-12", "day", "en-US")).toBe("Sep 12");
    expect(formatAxisDate("2026-09-01", "month", "en-US")).toBe("Sep");
    expect(formatAxisDate("2027-01-01", "month", "en-US")).toBe("Jan 2027");
    expect(formatAxisDate("2027-01-01", "year", "en-US")).toBe("2027");
    expect(formatAxisDate("2026-09-12", "day", "de-DE")).toBe("12. Sept.");
  });

  it("names the day under the crosshair, with its year when it is another", () => {
    expect(formatChartDay("2026-09-12", "2026-09-28", "en-US")).toBe("Sep 12");
    expect(formatChartDay("2024-03-31", "2026-09-28", "en-US")).toBe("Mar 31, 2024");
  });

  it("names months", () => {
    expect(formatMonth("2026-08-01", "en-US")).toBe("August");
    expect(formatMonth("2025-03-14", "en-US", { year: true })).toBe("March 2025");
    expect(formatMonth("2025-03-14", "es-ES", { year: true })).toBe("marzo de 2025");
  });
});

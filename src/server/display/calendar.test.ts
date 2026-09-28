import { describe, expect, it } from "vitest";
import { addDays, daysBetween, daysInMonth, displayCalendar, localDate } from "./calendar";

describe("local dates", () => {
  it("reads the calendar day in the screen's time zone", () => {
    const instant = new Date("2026-03-15T23:30:00Z");
    expect(localDate(instant, "UTC")).toBe("2026-03-15");
    expect(localDate(instant, "Europe/Paris")).toBe("2026-03-16");
    expect(localDate(instant, "America/Los_Angeles")).toBe("2026-03-15");
    expect(localDate(new Date("2026-03-15T09:00:00Z"), "Pacific/Kiritimati")).toBe("2026-03-15");
    expect(localDate(new Date("2026-03-15T11:00:00Z"), "Pacific/Kiritimati")).toBe("2026-03-16");
  });

  it("adds days across months, years and daylight saving changes", () => {
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-02-27", "2026-03-02")).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });

  it("knows the length of months", () => {
    expect(daysInMonth("2026-02-10")).toBe(28);
    expect(daysInMonth("2028-02-10")).toBe(29);
    expect(daysInMonth("2026-12-31")).toBe(31);
  });
});

describe("display calendar", () => {
  it("compares this month with the same number of days of the previous one", () => {
    expect(displayCalendar("2026-03-15", "30d")).toMatchObject({
      yesterday: "2026-03-14",
      monthStart: "2026-03-01",
      previousMonthStart: "2026-02-01",
      previousMonthCutoff: "2026-02-15",
      thirtyDaysAgo: "2026-02-13",
    });
  });

  it("caps the comparison at the end of a shorter previous month", () => {
    expect(displayCalendar("2026-03-31", "30d").previousMonthCutoff).toBe("2026-02-28");
    expect(displayCalendar("2026-01-05", "30d")).toMatchObject({
      previousMonthStart: "2025-12-01",
      previousMonthCutoff: "2025-12-05",
    });
  });

  it("covers the chart range and the last 30 days", () => {
    const calendar = displayCalendar("2026-03-15", "90d");
    expect(calendar.chartDays).toHaveLength(90);
    expect(calendar.chartDays.at(-1)).toBe("2026-03-15");
    expect(displayCalendar("2026-03-15", "12m").chartDays[0]).toBe("2025-03-16");
    expect(calendar.revenueDays).toHaveLength(30);
    expect(calendar.revenueDays[0]).toBe("2026-02-14");
  });
});

import { describe, expect, it } from "vitest";
import {
  addDays,
  calendarDay,
  chartDays,
  chartStart,
  daysBetween,
  daysInRange,
  displayCalendar,
} from "@/lib/display/calendar";

describe("calendar days", () => {
  it("reads the day in the screen's time zone", () => {
    const lateEvening = new Date("2026-09-28T23:30:00Z");
    expect(calendarDay(lateEvening, "UTC")).toBe("2026-09-28");
    expect(calendarDay(lateEvening, "Europe/Paris")).toBe("2026-09-29");
    expect(calendarDay(lateEvening, "America/Los_Angeles")).toBe("2026-09-28");
    expect(calendarDay(new Date("2026-03-15T09:00:00Z"), "Pacific/Kiritimati")).toBe("2026-03-15");
    expect(calendarDay(new Date("2026-03-15T11:00:00Z"), "Pacific/Kiritimati")).toBe("2026-03-16");
  });

  it("does calendar arithmetic across months, years and daylight saving", () => {
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-02-27", "2026-03-02")).toBe(3);
    expect(daysInRange("2026-02-27", "2026-03-02")).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
    expect(daysInRange("2026-03-02", "2026-02-27")).toEqual([]);
  });
});

describe("display calendar", () => {
  it("compares this month with the same number of days of the previous one", () => {
    expect(displayCalendar("2026-03-15")).toMatchObject({
      yesterday: "2026-03-14",
      monthStart: "2026-03-01",
      previousMonthStart: "2026-02-01",
      previousMonthCutoff: "2026-02-15",
      thirtyDaysAgo: "2026-02-13",
    });
  });

  it("caps the comparison at the end of a shorter previous month", () => {
    expect(displayCalendar("2026-03-31").previousMonthCutoff).toBe("2026-02-28");
    expect(displayCalendar("2028-03-31").previousMonthCutoff).toBe("2028-02-29");
    expect(displayCalendar("2026-01-05")).toMatchObject({
      previousMonthStart: "2025-12-01",
      previousMonthCutoff: "2025-12-05",
    });
  });

  it("covers the last 30 days for revenue", () => {
    const { revenueDays } = displayCalendar("2026-03-15");
    expect(revenueDays).toHaveLength(30);
    expect(revenueDays[0]).toBe("2026-02-14");
  });
});

describe("chart days", () => {
  it("start on the day the chart's change is measured from", () => {
    expect(chartStart("2026-03-15", "30d")).toBe(displayCalendar("2026-03-15").thirtyDaysAgo);
    expect(chartStart("2026-03-15", "12m")).toBe("2025-03-15");

    const days = chartDays("2026-03-15", "90d");
    expect(days).toHaveLength(91);
    expect(days.at(-1)).toBe("2026-03-15");
  });
});

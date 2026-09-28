import { describe, expect, it } from "vitest";
import {
  addDays,
  calendarDay,
  chartDays,
  chartStart,
  dayToUtcDate,
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
});

describe("chart days", () => {
  const today = "2026-03-15";

  it("start on the day the chart's change is measured from", () => {
    expect(chartStart(today, "30d")).toBe(displayCalendar(today).thirtyDaysAgo);
    expect(chartStart(today, "12m")).toBe("2025-03-15");

    const days = chartDays(today, "90d");
    expect(days).toHaveLength(91);
    expect(days.at(-1)).toBe(today);
  });

  it("start all time with the history, or like the 30-day chart without any", () => {
    expect(chartStart(today, "all", "2023-11-02")).toBe("2023-11-02");
    expect(chartStart(today, "all", today)).toBe(today);
    expect(chartStart(today, "all", null)).toBe(chartStart(today, "30d"));
    expect(chartDays(today, "all", null)).toEqual(chartDays(today, "30d"));
  });

  it("keep every day up to 400 of them, about a year", () => {
    expect(chartDays(today, "12m")).toHaveLength(366);
    const days = chartDays(today, "all", addDays(today, -399));
    expect(days).toEqual(daysInRange(addDays(today, -399), today));
  });

  it("keep the end of each week of a longer history, from its first day to today", () => {
    // A Wednesday, almost three years ago.
    const days = chartDays(today, "all", "2023-05-10");

    expect(days.slice(0, 3)).toEqual(["2023-05-10", "2023-05-14", "2023-05-21"]);
    expect(days.slice(-2)).toEqual(["2026-03-08", today]);
    const sundays = days.slice(1, -1);
    expect(sundays.every((day) => dayToUtcDate(day).getUTCDay() === 0)).toBe(true);
    expect(sundays.slice(1).every((day, index) => daysBetween(sundays[index], day) === 7)).toBe(
      true,
    );
    expect(days).toHaveLength(2 + 148);
  });

  it("keep the end of each month of a history of many years", () => {
    const days = chartDays(today, "all", "2016-07-20");

    expect(days.slice(0, 3)).toEqual(["2016-07-20", "2016-07-31", "2016-08-31"]);
    expect(days.slice(-3)).toEqual(["2026-01-31", "2026-02-28", today]);
    // The month ends from July 2016 to February 2026.
    expect(days).toHaveLength(2 + 116);
  });
});

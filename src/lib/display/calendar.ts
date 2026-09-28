import { DAY_MS } from "@/lib/durations";
import type { ChartRange } from "@/lib/screens/settings";

/*
 * Calendar days as `YYYY-MM-DD` strings, like `SeriesPoint.date`. The days of a screen are those
 * of its time zone (`settings.timeZone`), not of the device showing it. Once "today" is known
 * there, day arithmetic is time-zone free: it runs on UTC dates, which have no daylight saving
 * shifts.
 */

const dayFormats = new Map<string, Intl.DateTimeFormat>();

/** The calendar day of `instant` in `timeZone`. */
export function calendarDay(instant: Date, timeZone: string): string {
  let format = dayFormats.get(timeZone);
  if (!format) {
    // Slow to create, and the demo reads thousands of days while it builds its history.
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dayFormats.set(timeZone, format);
  }
  const parts = format.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Midnight UTC of a calendar day. */
export function dayToUtcDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

export function addDays(day: string, days: number): string {
  const date = dayToUtcDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** How many days separate two calendar days: 1 from one day to the next. */
export function daysBetween(from: string, to: string): number {
  return Math.round((dayToUtcDate(to).getTime() - dayToUtcDate(from).getTime()) / DAY_MS);
}

/** Every day from `from` to `to`, both included. */
export function daysInRange(from: string, to: string): string[] {
  const count = daysBetween(from, to) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, index) => addDays(from, index));
}

/** `YYYY-MM` of a calendar day. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

function startOfMonth(day: string): string {
  return `${monthOf(day)}-01`;
}

function daysInMonth(day: string): number {
  const [year, month] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The days the metrics of a screen refer to. */
export interface DisplayCalendar {
  today: string;
  yesterday: string;
  monthStart: string;
  previousMonthStart: string;
  /** Last day of the previous month compared with this month so far: same number of days. */
  previousMonthCutoff: string;
  /** For the growth badge: 30 days before today. */
  thirtyDaysAgo: string;
}

export function displayCalendar(today: string): DisplayCalendar {
  const monthStart = startOfMonth(today);
  const previousMonthStart = startOfMonth(addDays(monthStart, -1));
  const comparedDays = Math.min(Number(today.slice(8, 10)), daysInMonth(previousMonthStart));
  return {
    today,
    yesterday: addDays(today, -1),
    monthStart,
    previousMonthStart,
    previousMonthCutoff: addDays(previousMonthStart, comparedDays - 1),
    thirtyDaysAgo: addDays(today, -30),
  };
}

const CHART_RANGE_DAYS: Record<ChartRange, number> = { "30d": 30, "90d": 90, "12m": 365 };

/**
 * First day of the MRR chart: 30, 90 or 365 days before `last`. The chart starts on the day its
 * change is measured from, like the growth badge's "in 30 days".
 */
export function chartStart(last: string, range: ChartRange): string {
  return addDays(last, -CHART_RANGE_DAYS[range]);
}

/** Days of the MRR chart ending on `today`, oldest first. */
export function chartDays(today: string, range: ChartRange): string[] {
  return daysInRange(chartStart(today, range), today);
}

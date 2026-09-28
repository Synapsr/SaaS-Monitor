import "server-only";
import { DAY_MS } from "@/lib/durations";
import type { ChartRange } from "@/lib/screens/settings";

/*
 * Calendar days as `YYYY-MM-DD` strings. Once "today" is known in the screen's time zone, day
 * arithmetic is time-zone free: it runs on UTC dates, which have no daylight saving shifts.
 */

/** The calendar day of `instant` in `timeZone`. */
export function localDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function toUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number): string {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function daysInMonth(date: string): number {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Every day from `from` to `to`, both included. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/**
 * A moment surely before `date` starts in any time zone (UTC+14 is the earliest), so queries can
 * use their timestamp index before filtering on local days.
 */
export function instantBefore(date: string): Date {
  return new Date(toUtc(date) - DAY_MS);
}

const CHART_DAYS: Record<ChartRange, number> = { "30d": 30, "90d": 90, "12m": 365 };

/** The days every metric of a display refers to. */
export interface DisplayCalendar {
  today: string;
  yesterday: string;
  monthStart: string;
  previousMonthStart: string;
  /** Last day of the previous month compared with this month so far: same number of days. */
  previousMonthCutoff: string;
  /** For the growth badge: 30 days before today. */
  thirtyDaysAgo: string;
  /** Days of the MRR chart, oldest first. */
  chartDays: string[];
  /** The last 30 days, for revenue. */
  revenueDays: string[];
}

export function displayCalendar(today: string, chartRange: ChartRange): DisplayCalendar {
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
    chartDays: daysBetween(addDays(today, 1 - CHART_DAYS[chartRange]), today),
    revenueDays: daysBetween(addDays(today, -29), today),
  };
}

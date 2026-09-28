import { DAY_MS, HOUR_MS, MINUTE_MS } from "@/lib/durations";

/**
 * Dates on a screen live in the screen's time zone: "today", "this month" and the chart's days
 * follow `settings.timeZone`, not the time zone of the device showing it.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

/** `Intl.DateTimeFormat` is slow to create: screens format dates on every tick. */
function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat("en-US", options);
    formatters.set(key, cached);
  }
  return cached;
}

/** Calendar day of `date` in `timeZone`, as `YYYY-MM-DD` like `SeriesPoint.date`. */
export function calendarDay(date: Date, timeZone: string): string {
  const parts = formatter({
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Midnight UTC of a calendar day: calendar arithmetic without daylight saving surprises. */
export function dayToUtcDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

export function addDays(day: string, days: number): string {
  const date = dayToUtcDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((dayToUtcDate(to).getTime() - dayToUtcDate(from).getTime()) / DAY_MS);
}

/** `YYYY-MM` of a calendar day. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/** Calendar days from `from` to `to`, both included. */
export function daysInRange(from: string, to: string): string[] {
  const count = daysBetween(from, to);
  return Array.from({ length: Math.max(0, count + 1) }, (_, index) => addDays(from, index));
}

/**
 * Short relative times for a live feed: "just now", "5 min ago", "3 h ago", "yesterday", "Mon",
 * then "Sep 12".
 */
export function formatRelativeTime(date: Date, now: Date, timeZone: string): string {
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  if (elapsed < 45_000) return "just now";
  if (elapsed < HOUR_MS) return `${Math.max(1, Math.round(elapsed / MINUTE_MS))} min ago`;

  const day = calendarDay(date, timeZone);
  const today = calendarDay(now, timeZone);
  const age = daysBetween(day, today);
  if (age === 0 || elapsed < 6 * HOUR_MS) return `${Math.floor(elapsed / HOUR_MS)} h ago`;
  if (age === 1) return "yesterday";
  if (age < 7) return formatter({ timeZone, weekday: "short" }).format(date);

  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return formatter({
    timeZone,
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  }).format(date);
}

/** Wall clock of a screen: 24-hour time reads at a glance and never needs AM/PM. */
export function formatClock(now: Date, timeZone: string): { time: string; date: string } {
  return {
    time: formatter({ timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now),
    date: formatter({ timeZone, weekday: "long", month: "long", day: "numeric" }).format(now),
  };
}

/** When a goal should be reached: a precise day when it is close, else a month ("Feb 2027"). */
export function formatEta(eta: Date, now: Date, timeZone: string): string {
  const days = (eta.getTime() - now.getTime()) / DAY_MS;
  if (days < 1) return "today";
  if (days < 2) return "tomorrow";
  if (days < 45) return formatter({ timeZone, month: "short", day: "numeric" }).format(eta);
  return formatter({ timeZone, month: "short", year: "numeric" }).format(eta);
}

/** Axis label of a chart day (`YYYY-MM-DD`): "Sep 12", or "Sep" when `monthOnly`. */
export function formatChartDay(day: string, monthOnly: boolean): string {
  const date = dayToUtcDate(day);
  // January also names its year, so that a 12-month axis reads across the new year.
  const options: Intl.DateTimeFormatOptions = monthOnly
    ? { month: "short", year: date.getUTCMonth() === 0 ? "numeric" : undefined }
    : { month: "short", day: "numeric" };
  return formatter({ timeZone: "UTC", ...options }).format(date);
}

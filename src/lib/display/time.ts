import { calendarDay, dayToUtcDate, daysBetween } from "@/lib/display/calendar";
import { DAY_MS, HOUR_MS, MINUTE_MS } from "@/lib/durations";

/** Dates and times as a screen writes them, in the screen's time zone. */

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

/** Name of the month of a calendar day: "September". */
export function formatMonth(day: string): string {
  return formatter({ timeZone: "UTC", month: "long" }).format(dayToUtcDate(day));
}

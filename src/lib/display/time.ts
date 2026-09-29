import { calendarDay, dayToUtcDate, daysBetween } from "@/lib/display/calendar";
import type { DisplayLocale } from "@/lib/display/i18n";
import { DAY_MS, HOUR_MS, MINUTE_MS } from "@/lib/durations";

/** Dates and times as a screen writes them, in its time zone and its locale. */

const formatters = new Map<string, Intl.DateTimeFormat>();

/** `Intl.DateTimeFormat` is slow to create: screens format dates on every tick. */
function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, cached);
  }
  return cached;
}

/**
 * When a feed item happened, short enough for a narrow column: "just now", "5 min ago",
 * "3 h ago", "yesterday", "Mon", then "Sep 12". The dashboard writes relative times in full
 * with `formatRelativeTime` (`src/lib/format.ts`).
 */
export function formatFeedTime(
  date: Date,
  now: Date,
  timeZone: string,
  { locale, text }: DisplayLocale,
): string {
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  if (elapsed < 45_000) return text.feed.justNow;
  if (elapsed < HOUR_MS) return text.feed.minutesAgo(Math.max(1, Math.round(elapsed / MINUTE_MS)));

  const day = calendarDay(date, timeZone);
  const today = calendarDay(now, timeZone);
  const age = daysBetween(day, today);
  if (age === 0 || elapsed < 6 * HOUR_MS) return text.feed.hoursAgo(Math.floor(elapsed / HOUR_MS));
  if (age === 1) return text.feed.yesterday;
  if (age < 7) return formatter(locale, { timeZone, weekday: "short" }).format(date);

  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return formatter(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  }).format(date);
}

/** Wall clock of a screen: 24-hour time reads at a glance and never needs AM/PM. */
export function formatClock(
  now: Date,
  timeZone: string,
  locale: string,
): { time: string; date: string } {
  return {
    time: formatter(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now),
    date: formatter(locale, { timeZone, weekday: "long", month: "long", day: "numeric" }).format(
      now,
    ),
  };
}

/** When a goal should be reached: a precise day when it is close, else a month ("Feb 2027"). */
export function formatEta(
  eta: Date,
  now: Date,
  timeZone: string,
  { locale, text }: DisplayLocale,
): string {
  const days = (eta.getTime() - now.getTime()) / DAY_MS;
  if (days < 1) return text.goal.today;
  if (days < 2) return text.goal.tomorrow;
  if (days < 45) return formatter(locale, { timeZone, month: "short", day: "numeric" }).format(eta);
  return formatter(locale, { timeZone, month: "short", year: "numeric" }).format(eta);
}

/** What the labels of a chart's time axis name: days (or weeks), months or years. */
export type AxisUnit = "day" | "month" | "year";

/** Axis label of a chart day (`YYYY-MM-DD`): "Sep 12" on an axis of days, "Sep" or "2027". */
export function formatAxisDate(day: string, unit: AxisUnit, locale: string): string {
  const date = dayToUtcDate(day);
  const options: Record<AxisUnit, Intl.DateTimeFormatOptions> = {
    day: { month: "short", day: "numeric" },
    // January also names its year, so that an axis of months reads across the new year.
    month: { month: "short", year: date.getUTCMonth() === 0 ? "numeric" : undefined },
    year: { year: "numeric" },
  };
  return formatter(locale, { timeZone: "UTC", ...options[unit] }).format(date);
}

/** A chart day under the crosshair: "Sep 12", with its year when it isn't `today`'s. */
export function formatChartDay(day: string, today: string, locale: string): string {
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return formatter(locale, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  }).format(dayToUtcDate(day));
}

/** Name of the month of a calendar day: "September", or "September 2025" with its year. */
export function formatMonth(day: string, locale: string, options: { year?: boolean } = {}): string {
  return formatter(locale, {
    timeZone: "UTC",
    month: "long",
    year: options.year ? "numeric" : undefined,
  }).format(dayToUtcDate(day));
}

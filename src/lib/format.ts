import { DAY_SECONDS, HOUR_SECONDS, MINUTE_SECONDS } from "@/lib/durations";

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const countFormat = new Intl.NumberFormat("en-US");

/**
 * Each unit is used from `from` seconds on. Weeks and months only start at two of them:
 * "in 7 days" is clearer than "next week".
 */
const UNITS: { unit: Intl.RelativeTimeFormatUnit; size: number; from: number }[] = [
  { unit: "year", size: 365 * DAY_SECONDS, from: 365 * DAY_SECONDS },
  { unit: "month", size: 30 * DAY_SECONDS, from: 60 * DAY_SECONDS },
  { unit: "week", size: 7 * DAY_SECONDS, from: 14 * DAY_SECONDS },
  { unit: "day", size: DAY_SECONDS, from: DAY_SECONDS },
  { unit: "hour", size: HOUR_SECONDS, from: HOUR_SECONDS },
  { unit: "minute", size: MINUTE_SECONDS, from: 0 },
];

/** "just now", "3 minutes ago", "yesterday", "in 7 days"… */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  if (Math.abs(seconds) < 45) return "just now";
  const { unit, size } =
    UNITS.find(({ from }) => Math.abs(seconds) >= from) ?? UNITS[UNITS.length - 1];
  return relativeTimeFormat.format(Math.round(seconds / size), unit);
}

/** Rough duration for things that happen periodically: "~8 min", "~2 hours". */
export function formatApproximateDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `~${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** 12480 → "12,480". */
export function formatCount(value: number): string {
  return countFormat.format(value);
}

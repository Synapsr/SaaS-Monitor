/*
 * Durations named after their unit: milliseconds for `Date` arithmetic and timers, seconds for
 * Unix times (as Stripe uses them) and intervals counted in seconds.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export const MINUTE_SECONDS = 60;
export const HOUR_SECONDS = 60 * MINUTE_SECONDS;
export const DAY_SECONDS = 24 * HOUR_SECONDS;

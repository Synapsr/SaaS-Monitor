import "server-only";
import {
  demoEventTimes,
  demoPeriodOf,
  demoPeriodState,
  playDemoEvents,
  startDemoPeriod,
} from "@/lib/display/demo/clock";
import type { DemoOptions } from "@/lib/display/demo/options";
import type { DemoWorld } from "@/lib/display/demo/simulation";
import type { DisplayState } from "@/lib/display/types";

/*
 * The demo screen, served to the clients that poll it (`/api/screens/demo/state`). Its state is a
 * function of the time, which every poll would rebuild from the start of the hour, a year of
 * history included: the worlds the latest poll reached are kept, and the next one plays what
 * happened since. No database, no Stripe account: the demo is the same on every server.
 */

/** Variants of the demo kept at once: each query string (`?lang=fr`, `?accounts=2`…) makes one. */
const KEPT_VARIANTS = 8;

interface PlayedHour {
  period: number;
  /** The worlds at the start of the hour, for a poll arriving behind the latest one. */
  start: DemoWorld[];
  /** Events the latest poll played. */
  played: number;
  worlds: DemoWorld[];
}

/** By variant, the most recently polled last. */
const variants = new Map<string, PlayedHour>();

export function demoDisplayState(options: DemoOptions, now = new Date()): DisplayState {
  const period = demoPeriodOf(now);
  const times = demoEventTimes(period, now);
  const key = JSON.stringify(options);
  const kept = variants.get(key);
  const hour = kept?.period === period.index ? kept : undefined;

  const start = hour?.start ?? startDemoPeriod(options, period);
  const behind = hour !== undefined && hour.played > times.length;
  const worlds =
    hour && !behind
      ? playDemoEvents(hour.worlds, times, hour.played)
      : playDemoEvents(start, times);

  variants.delete(key);
  variants.set(
    key,
    hour && behind ? hour : { period: period.index, start, played: times.length, worlds },
  );
  for (const oldest of variants.keys()) {
    if (variants.size <= KEPT_VARIANTS) break;
    variants.delete(oldest);
  }
  return demoPeriodState(worlds, period, now);
}

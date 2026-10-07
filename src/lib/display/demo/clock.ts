import type { DemoOptions } from "@/lib/display/demo/options";
import {
  advanceDemoWorlds,
  createDemoWorlds,
  reseedDemo,
  type DemoWorld,
} from "@/lib/display/demo/simulation";
import { demoState } from "@/lib/display/demo/state";
import { createRandom, randomBetween } from "@/lib/display/random";
import type { DisplayState } from "@/lib/display/types";
import { HOUR_MS, MINUTE_MS } from "@/lib/durations";

/*
 * The demo screen for clients that poll it (`GET /api/screens/demo/state`): the SaaS Monitor app,
 * its widgets and watches. No browser keeps the simulation running for them, so every poll derives
 * it from the clock. Each hour, on the hour, the demo starts over from its history, just below its
 * goal, then plays one event a minute, at a second the minute itself decides. Polls of the same
 * hour agree on everything that happened before them, whoever asks and whenever.
 *
 * Starting over keeps the numbers believable: at the pace of a demo, a day of events would be
 * months of a real business's revenue.
 */

/** How long the demo plays before it starts over. */
export const DEMO_PERIOD_MS = HOUR_MS;
/** One event per minute, between its 15th and 45th seconds: 30 to 90 seconds apart. */
const EVENT_SLOT_MS = MINUTE_MS;
const EVENT_EARLIEST_MS = 15_000;
const EVENT_LATEST_MS = 45_000;
const EVENT_SALT = 0x0c10c;
const PERIOD_SALT = 0x4a11;

/** An hour of the demo. */
export interface DemoPeriod {
  /** Hours since the Unix epoch: tells this hour's events apart from those of other hours. */
  index: number;
  /** Where its history ends and its events start. */
  start: Date;
}

export function demoPeriodOf(now: Date): DemoPeriod {
  const index = Math.floor(now.getTime() / DEMO_PERIOD_MS);
  return { index, start: new Date(index * DEMO_PERIOD_MS) };
}

/** When the events of `period` happen, up to `now` included, oldest first. */
export function demoEventTimes(period: DemoPeriod, now: Date): Date[] {
  const times: Date[] = [];
  const start = period.start.getTime();
  for (let slot = start; slot < start + DEMO_PERIOD_MS; slot += EVENT_SLOT_MS) {
    const random = createRandom((slot / EVENT_SLOT_MS) ^ EVENT_SALT);
    const at = slot + Math.round(randomBetween(random, EVENT_EARLIEST_MS, EVENT_LATEST_MS));
    if (at > now.getTime()) break;
    times.push(new Date(at));
  }
  return times;
}

/**
 * The demo's accounts at the start of `period`: the history of the web demo, ending there, whose
 * events then take the course of this hour.
 */
export function startDemoPeriod(options: DemoOptions, period: DemoPeriod): DemoWorld[] {
  return createDemoWorlds(options, period.start).map((world) =>
    reseedDemo(world, period.index ^ PERIOD_SALT),
  );
}

/**
 * Plays the events at `times` from the `played`-th on, on worlds that played the ones before:
 * those of `startDemoPeriod` for none, or those of a previous poll of the same hour to resume.
 */
export function playDemoEvents(
  worlds: readonly DemoWorld[],
  times: readonly Date[],
  played = 0,
): DemoWorld[] {
  let current = [...worlds];
  for (let turn = played; turn < times.length; turn += 1) {
    current = advanceDemoWorlds(current, turn, times[turn]);
  }
  return current;
}

/**
 * The state of worlds playing `period`. Every hour numbers its items from where its history ends,
 * like the previous hour did: their ids name the hour, so that a display that saw the previous one
 * plays these as new.
 */
export function demoPeriodState(
  worlds: readonly DemoWorld[],
  period: DemoPeriod,
  now: Date,
): DisplayState {
  const state = demoState(worlds, now);
  return {
    ...state,
    feed: state.feed.map((item) => ({ ...item, id: `${item.id}@${period.index}` })),
  };
}

/** The demo screen at `now`, computed from scratch: the server keeps the worlds between polls. */
export function demoStateAt(options: DemoOptions, now: Date): DisplayState {
  const period = demoPeriodOf(now);
  const worlds = playDemoEvents(startDemoPeriod(options, period), demoEventTimes(period, now));
  return demoPeriodState(worlds, period, now);
}

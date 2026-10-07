import { describe, expect, it } from "vitest";
import { DEMO_CURRENCY, DEMO_GOAL } from "@/lib/display/demo/business";
import {
  demoEventTimes,
  demoPeriodOf,
  demoPeriodState,
  demoStateAt,
  playDemoEvents,
  startDemoPeriod,
} from "@/lib/display/demo/clock";
import { parseDemoOptions } from "@/lib/display/demo/options";
import type { DisplayState, FeedItem } from "@/lib/display/types";
import { HOUR_MS, MINUTE_MS } from "@/lib/durations";
import { toMinorUnits } from "@/lib/money";

const { options } = parseDemoOptions({});
const GOAL = toMinorUnits(DEMO_GOAL, DEMO_CURRENCY);
/** 10 a.m. in New York, the demo's time zone. */
const hour = new Date("2026-10-07T14:00:00Z");
const at = (minutes: number, seconds = 0) =>
  new Date(hour.getTime() + minutes * MINUTE_MS + seconds * 1_000);

/** What `later` shows that `earlier` did not. */
function newItems(earlier: DisplayState, later: DisplayState): FeedItem[] {
  const seen = new Set(earlier.feed.map((item) => item.id));
  return later.feed.filter((item) => !seen.has(item.id));
}

describe("demo clock", () => {
  it("starts an hour of the demo on the hour", () => {
    expect(demoPeriodOf(at(59, 59)).start).toEqual(hour);
    expect(demoPeriodOf(at(60)).start).toEqual(at(60));
    expect(demoPeriodOf(at(60)).index).toBe(demoPeriodOf(hour).index + 1);
  });

  it("plays an event every 30 to 90 seconds, whenever a poll asks", () => {
    const period = demoPeriodOf(hour);
    const times = demoEventTimes(period, at(59, 59));
    expect(times).toHaveLength(60);
    expect(times[0].getTime() - hour.getTime()).toBeGreaterThanOrEqual(15_000);
    for (let index = 1; index < times.length; index += 1) {
      const gap = times[index].getTime() - times[index - 1].getTime();
      expect(gap).toBeGreaterThanOrEqual(30_000);
      expect(gap).toBeLessThanOrEqual(90_000);
    }
    expect(demoEventTimes(period, at(30))).toEqual(times.filter((time) => time <= at(30)));
    // Another hour has its own seconds.
    const next = demoEventTimes(demoPeriodOf(at(60)), at(119, 59));
    expect(next.map((time) => time.getTime() % MINUTE_MS)).not.toEqual(
      times.map((time) => time.getTime() % MINUTE_MS),
    );
  });

  it("gives every poll at the same time the same state", () => {
    expect(demoStateAt(options, at(12, 5))).toEqual(demoStateAt(options, at(12, 5)));
  });

  it("resumes the worlds of a previous poll as if it played them from the start", () => {
    const period = demoPeriodOf(hour);
    const times = demoEventTimes(period, at(40));
    const start = startDemoPeriod(options, period);
    const halfway = playDemoEvents(start, times.slice(0, 20));
    expect(playDemoEvents(halfway, times, 20)).toEqual(playDemoEvents(start, times));
  });
});

describe("demo polled every few seconds", () => {
  const [first] = demoEventTimes(demoPeriodOf(hour), at(20)).filter((time) => time > at(19));

  it("keeps the same numbers and feed between two events", () => {
    const before = demoStateAt(options, new Date(first.getTime() + 1_000));
    const after = demoStateAt(options, new Date(first.getTime() + 9_000));
    expect({ ...after, generatedAt: before.generatedAt }).toEqual(before);
  });

  it("agrees with earlier polls on what happened, and adds what happened since", () => {
    const earlier = demoStateAt(options, at(20));
    const later = demoStateAt(options, at(23));

    const unchanged = later.feed.filter((item) => !newItems(earlier, later).includes(item));
    expect(unchanged).toEqual(earlier.feed.slice(0, unchanged.length));

    const added = newItems(earlier, later);
    const times = new Set(
      demoEventTimes(demoPeriodOf(hour), at(23))
        .filter((time) => time > at(20))
        .map((time) => time.getTime()),
    );
    expect(times.size).toBe(3);
    expect(added.length).toBeGreaterThanOrEqual(3);
    for (const item of added) {
      expect(item.live).toBe(true);
      expect(Date.parse(item.occurredAt)).toBeGreaterThan(at(20).getTime());
    }

    const sum = (items: FeedItem[]) => items.reduce((total, item) => total + item.amount, 0);
    const payments = added.filter((item) => item.kind === "payment");
    const customers = added.filter((item) => item.kind === "customer");
    const movements = added.filter((item) => item.kind !== "payment" && item.kind !== "customer");
    expect(later.metrics.revenue.today - earlier.metrics.revenue.today).toBe(sum(payments));
    expect(later.metrics.revenue.monthToDate - earlier.metrics.revenue.monthToDate).toBe(
      sum(payments),
    );
    expect(later.metrics.mrr - earlier.metrics.mrr).toBe(sum(movements));
    expect(later.metrics.customersCreatedToday - earlier.metrics.customersCreatedToday).toBe(
      customers.length,
    );
    expect(later.series.mrr.at(-1)?.value).toBe(later.metrics.mrr);
  });

  it("opens every hour with a sale", () => {
    const opening = newItems(demoStateAt(options, hour), demoStateAt(options, at(1)));
    expect(opening.map((item) => [item.kind, item.planName])).toEqual([
      ["payment", "Team"],
      ["new", "Team"],
      ["customer", null],
    ]);
  });
});

describe("demo hours", () => {
  /** Each hour of a day, at its start, after half an hour, and at its end. */
  const hours = Array.from({ length: 24 }, (_, index) => {
    const period = demoPeriodOf(new Date(Date.UTC(2026, 9, 7, index)));
    const end = new Date(period.start.getTime() + HOUR_MS - 1);
    const times = demoEventTimes(period, end);
    const start = startDemoPeriod(options, period);
    const halfway = playDemoEvents(start, times.slice(0, 30));
    return {
      start: demoPeriodState(start, period, period.start),
      halfway: demoPeriodState(halfway, period, times[29]),
      end: demoPeriodState(playDemoEvents(halfway, times, 30), period, end),
    };
  });

  it("start just below the goal, and cross it within half an hour", () => {
    for (const { start, halfway } of hours) {
      expect(start.metrics.mrr).toBeLessThan(GOAL);
      expect(start.metrics.mrr).toBeGreaterThan(GOAL - 50_000);
      expect(halfway.metrics.mrr).toBeGreaterThanOrEqual(GOAL);
    }
  });

  it("keep believable numbers until they start over", () => {
    for (const { start, end } of hours) {
      const { metrics } = end;
      expect(metrics.mrr).toBeGreaterThanOrEqual(GOAL);
      expect(metrics.mrr).toBeLessThan(2_000_000);
      expect(metrics.mrr30DaysAgo).toBeLessThan(metrics.mrr);
      expect(metrics.arr).toBe(metrics.mrr * 12);
      expect(metrics.revenue.today).toBeGreaterThan(start.metrics.revenue.today);
      expect(metrics.revenue.today).toBeLessThan(1_200_000);
      expect(metrics.revenue.monthToDate).toBeGreaterThanOrEqual(metrics.revenue.today);
      expect(metrics.activeCustomers).toBeGreaterThan(150);
      expect(end.series.mrr).toHaveLength(91);
      expect(end.series.mrr.at(-1)?.value).toBe(metrics.mrr);
    }
  });

  it("name what each hour plays apart from the previous hour's", () => {
    for (let index = 1; index < hours.length; index += 1) {
      const ids = new Set(hours[index - 1].end.feed.map((item) => item.id));
      expect(hours[index].end.feed.some((item) => ids.has(item.id))).toBe(false);
    }
  });
});

describe("demo of two accounts, polled", () => {
  it("plays both, like the page does", () => {
    const two = parseDemoOptions({ accounts: "2" }).options;
    const state = demoStateAt(two, at(10));
    expect(state.screen.name).toBe("Acme Inc.");
    expect(state.views.map((view) => view.accountId)).toEqual(["demo", "demo-mail"]);
    const live = state.feed.filter((item) => item.live);
    expect(new Set(live.map((item) => item.accountId))).toEqual(new Set(["demo", "demo-mail"]));
  });
});

import { describe, expect, it } from "vitest";
import {
  advanceDemo,
  createDemoWorld,
  DEMO_GOAL,
  demoState,
  nextDemoDelay,
  parseDemoOptions,
  type DemoWorld,
} from "@/lib/display/demo";
import { addDays, calendarDay } from "@/lib/display/time";
import type { DisplayState } from "@/lib/display/types";

const { options } = parseDemoOptions({});
const now = new Date("2026-09-28T14:32:00Z");

/** Runs the live simulation for `events` events, returning every state a screen would see. */
function simulate(world: DemoWorld, events: number): { world: DemoWorld; states: DisplayState[] } {
  let time = now.getTime();
  const states: DisplayState[] = [];
  for (let index = 0; index < events; index += 1) {
    time += nextDemoDelay(world);
    world = advanceDemo(world, new Date(time));
    states.push(demoState(world, new Date(time)));
  }
  return { world, states };
}

function expectConsistent(state: DisplayState) {
  const { metrics, series } = state;
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const today = series.mrr.at(-1)!.date;

  expect(series.mrr.at(-1)?.value).toBe(metrics.mrr);
  expect(series.mrr.find((point) => point.date === addDays(today, -30))?.value).toBe(
    metrics.mrr30DaysAgo,
  );
  expect(metrics.arr).toBe(metrics.mrr * 12);
  expect(metrics.arpu).toBe(Math.round(metrics.mrr / metrics.activeCustomers));
  expect(state.accounts[0].mrr).toBe(metrics.mrr);

  expect(series.revenue).toHaveLength(30);
  expect(series.revenue.at(-1)?.value).toBe(metrics.revenue.today);
  expect(series.revenue.at(-2)?.value).toBe(metrics.revenue.yesterday);
  expect(sum(series.revenue.map((point) => point.value))).toBe(metrics.revenue.last30Days);

  const { thisMonth } = metrics;
  expect(thisMonth.net).toBe(
    thisMonth.new +
      thisMonth.expansion +
      thisMonth.reactivation +
      thisMonth.contraction +
      thisMonth.churn,
  );
  const endOfLastMonth = series.mrr.find(
    (point) => point.date === addDays(`${today.slice(0, 7)}-01`, -1),
  );
  if (endOfLastMonth) expect(thisMonth.net).toBe(metrics.mrr - endOfLastMonth.value);

  const times = state.feed.map((item) => Date.parse(item.occurredAt));
  expect(times).toEqual([...times].sort((a, b) => b - a));
  expect(new Set(state.feed.map((item) => item.id)).size).toBe(state.feed.length);
}

describe("demo options", () => {
  it("reads the query parameters, ignoring unknown values", () => {
    expect(
      parseDemoOptions({
        accent: "violet",
        sound: "arcade",
        names: "1",
        range: "12m",
        tz: "Europe/Paris",
        preview: "1",
      }),
    ).toEqual({
      options: {
        accent: "violet",
        soundPack: "arcade",
        showCustomerNames: true,
        chartRange: "12m",
        timeZone: "Europe/Paris",
      },
      preview: true,
    });
    expect(parseDemoOptions({ accent: "pink", range: "5y", tz: "Mars/Olympus" })).toEqual({
      options: {
        accent: "emerald",
        soundPack: "register",
        showCustomerNames: false,
        chartRange: "90d",
        timeZone: "America/New_York",
      },
      preview: false,
    });
    expect(parseDemoOptions({ sound: "off" }).options.soundPack).toBeNull();
  });
});

describe("demo history", () => {
  const world = createDemoWorld(options, now);
  const state = demoState(world, now);

  it("is deterministic, so the server and the browser render the same screen", () => {
    expect(demoState(createDemoWorld(options, now), now)).toEqual(state);
  });

  it("grows from about $9k to just below the $15k goal in 90 days", () => {
    expect(state.series.mrr).toHaveLength(91);
    expect(state.series.mrr[0].value).toBeGreaterThan(850_000);
    expect(state.series.mrr[0].value).toBeLessThan(950_000);
    expect(state.metrics.mrr).toBeGreaterThan(DEMO_GOAL * 100 - 50_000);
    expect(state.metrics.mrr).toBeLessThan(DEMO_GOAL * 100 - 20_000);
    expect(state.metrics.mrr).toBeGreaterThan(state.metrics.mrr30DaysAgo);
  });

  it("keeps every metric consistent", () => {
    expectConsistent(state);
  });

  it("ends at the same MRR whatever the time of day", () => {
    const night = new Date("2026-09-28T03:10:00Z");
    expect(demoState(createDemoWorld(options, night), night).metrics.mrr).toBe(state.metrics.mrr);
  });

  it("covers a year for the 12-month chart", () => {
    const yearly = { ...options, chartRange: "12m" as const };
    const series = demoState(createDemoWorld(yearly, now), now).series.mrr;
    expect(series).toHaveLength(366);
    expect(series[0].date).toBe(addDays(calendarDay(now, options.timeZone), -365));
  });

  it("imports its feed from history, with plausible payments", () => {
    expect(state.feed.length).toBeGreaterThan(10);
    expect(state.feed.every((item) => !item.live && item.customerName === null)).toBe(true);
    for (const item of state.feed.filter((candidate) => candidate.kind === "payment")) {
      expect(item.amount).toBeGreaterThanOrEqual(2_900);
      expect(item.amount).toBeLessThanOrEqual(49_000);
    }
  });

  it("shows customer names only when asked", () => {
    const named = demoState(createDemoWorld({ ...options, showCustomerNames: true }, now), now);
    expect(named.feed.every((item) => item.customerName)).toBe(true);
  });
});

describe("demo simulation", () => {
  const world = createDemoWorld(options, now);
  const { states } = simulate(world, 30);

  it("opens with a new customer after five seconds", () => {
    expect(nextDemoDelay(world)).toBe(5_000);
    const [first] = states;
    expect(first.feed.slice(0, 2).map((item) => [item.kind, item.live])).toEqual([
      ["payment", true],
      ["new", true],
    ]);
  });

  it("then plays an event every 12 to 25 seconds", () => {
    let current = advanceDemo(world, now);
    for (let index = 0; index < 20; index += 1) {
      const delay = nextDemoDelay(current);
      expect(delay).toBeGreaterThanOrEqual(12_000);
      expect(delay).toBeLessThanOrEqual(25_000);
      current = advanceDemo(current, new Date(now.getTime() + index * 20_000));
    }
  });

  it("crosses the goal within the first minutes", () => {
    const crossing = states.findIndex((state) => state.metrics.mrr >= DEMO_GOAL * 100);
    expect(crossing).toBeGreaterThanOrEqual(1);
    expect(crossing).toBeLessThan(8);
  });

  it("keeps every metric consistent while it runs", () => {
    states.forEach(expectConsistent);
  });

  it("never falls back below the goal once it has been celebrated", () => {
    const { states: long } = simulate(world, 120);
    const crossing = long.findIndex((state) => state.metrics.mrr >= DEMO_GOAL * 100);
    for (const state of long.slice(crossing)) {
      expect(state.metrics.mrr).toBeGreaterThanOrEqual(DEMO_GOAL * 100);
    }
  });

  it("rolls over to the next day", () => {
    let current = world;
    const tomorrow = new Date(now.getTime() + 24 * 3_600_000);
    current = advanceDemo(current, tomorrow);
    const state = demoState(current, tomorrow);
    expect(state.series.mrr.at(-1)?.date).toBe(calendarDay(tomorrow, options.timeZone));
    expectConsistent(state);
  });
});

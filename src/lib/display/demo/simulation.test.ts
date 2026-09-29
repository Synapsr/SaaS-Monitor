import { describe, expect, it } from "vitest";
import { addDays, calendarDay } from "@/lib/display/calendar";
import { DEMO_CURRENCY, DEMO_GOAL } from "@/lib/display/demo/business";
import { parseDemoOptions } from "@/lib/display/demo/options";
import {
  advanceDemo,
  advanceDemoWorlds,
  createDemoWorld,
  createDemoWorlds,
  nextDemoDelay,
  type DemoWorld,
} from "@/lib/display/demo/simulation";
import { demoState } from "@/lib/display/demo/state";
import { initialMomentTracker, trackMoments } from "@/lib/display/moments";
import type { DisplayState } from "@/lib/display/types";
import { toMinorUnits } from "@/lib/money";

const { options } = parseDemoOptions({});
/** The demo's goal in cents, like every amount of its state. */
const GOAL = toMinorUnits(DEMO_GOAL, DEMO_CURRENCY);
const now = new Date("2026-09-28T14:32:00Z");

/** Runs the live simulation for `events` events, returning every state a screen would see. */
function simulate(world: DemoWorld, events: number): { world: DemoWorld; states: DisplayState[] } {
  let time = now.getTime();
  const states: DisplayState[] = [];
  for (let index = 0; index < events; index += 1) {
    time += nextDemoDelay(world);
    world = advanceDemo(world, new Date(time));
    states.push(demoState([world], new Date(time)));
  }
  return { world, states };
}

function expectConsistent(state: DisplayState) {
  const { metrics, series } = state;
  const today = series.mrr.at(-1)!.date;

  expect(series.mrr.at(-1)?.value).toBe(metrics.mrr);
  expect(series.mrr.find((point) => point.date === addDays(today, -30))?.value).toBe(
    metrics.mrr30DaysAgo,
  );
  expect(metrics.arr).toBe(metrics.mrr * 12);
  expect(metrics.arpu).toBe(Math.round(metrics.mrr / metrics.activeCustomers));
  expect(metrics.revenue.monthToDate).toBeGreaterThanOrEqual(metrics.revenue.today);

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

describe("demo history", () => {
  const world = createDemoWorld(options, now);
  const state = demoState([world], now);

  it("is deterministic, so the server and the browser render the same screen", () => {
    expect(demoState([createDemoWorld(options, now)], now)).toEqual(state);
  });

  it("grows from about $9k to just below the $15k goal in 90 days", () => {
    expect(state.series.mrr).toHaveLength(91);
    expect(state.series.mrr[0].value).toBeGreaterThan(850_000);
    expect(state.series.mrr[0].value).toBeLessThan(950_000);
    expect(state.metrics.mrr).toBeGreaterThan(GOAL - 50_000);
    expect(state.metrics.mrr).toBeLessThan(GOAL - 20_000);
    expect(state.metrics.mrr).toBeGreaterThan(state.metrics.mrr30DaysAgo);
  });

  it("keeps every metric consistent", () => {
    expectConsistent(state);
  });

  it("ends at the same MRR whatever the time of day", () => {
    const night = new Date("2026-09-28T03:10:00Z");
    expect(demoState([createDemoWorld(options, night)], night).metrics.mrr).toBe(state.metrics.mrr);
  });

  it("covers a year for the 12-month chart", () => {
    const yearly = { ...options, chartRange: "12m" as const };
    const series = demoState([createDemoWorld(yearly, now)], now).series.mrr;
    expect(series).toHaveLength(366);
    expect(series[0].date).toBe(addDays(calendarDay(now, options.timeZone), -365));
  });

  it("charts its whole history for all time, from about $3k", () => {
    const allTime = demoState([createDemoWorld({ ...options, chartRange: "all" }, now)], now);
    const today = calendarDay(now, options.timeZone);
    expect(allTime.series.mrr[0].date).toBe(addDays(today, -373));
    expect(allTime.series.mrr).toHaveLength(374);
    expect(allTime.series.mrr[0].value).toBeLessThan(400_000);
    expectConsistent(allTime);
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
    const named = demoState([createDemoWorld({ ...options, showCustomerNames: true }, now)], now);
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
    const crossing = states.findIndex((state) => state.metrics.mrr >= GOAL);
    expect(crossing).toBeGreaterThanOrEqual(1);
    expect(crossing).toBeLessThan(8);
  });

  it("shows ARR when asked, reaching its goal of $180K ARR at the same moment", () => {
    const inArr = createDemoWorld({ ...options, metric: "arr" }, now);
    const first = demoState([inArr], now);
    expect(first.screen.settings).toMatchObject({ metric: "arr", goal: 180_000 });
    // The state stays in MRR: the screen presents it in ARR.
    expect(first.metrics).toEqual(demoState([world], now).metrics);

    let tracker = initialMomentTracker;
    const milestones = [first, ...simulate(inArr, 8).states].flatMap((state) => {
      const tracked = trackMoments(tracker, state);
      tracker = tracked.tracker;
      return tracked.moments.filter((moment) => moment.kind === "milestone");
    });
    expect(milestones).toEqual([
      expect.objectContaining({ amount: 18_000_000, metric: "arr", isGoal: true }),
    ]);
  });

  it("keeps every metric consistent while it runs", () => {
    states.forEach(expectConsistent);
  });

  it("never falls back below the goal once it has been celebrated", () => {
    const { states: long } = simulate(world, 120);
    const crossing = long.findIndex((state) => state.metrics.mrr >= GOAL);
    for (const state of long.slice(crossing)) {
      expect(state.metrics.mrr).toBeGreaterThanOrEqual(GOAL);
    }
  });

  it("rolls over to the next day", () => {
    let current = world;
    const tomorrow = new Date(now.getTime() + 24 * 3_600_000);
    current = advanceDemo(current, tomorrow);
    const state = demoState([current], tomorrow);
    expect(state.series.mrr.at(-1)?.date).toBe(calendarDay(tomorrow, options.timeZone));
    expectConsistent(state);
  });
});

describe("demo sign-ups", () => {
  const world = createDemoWorld(options, now);
  const state = demoState([world], now);

  it("creates customers when visitors sign up, and when they buy", () => {
    const customers = state.feed.filter((item) => item.kind === "customer");
    expect(customers.length).toBeGreaterThan(0);
    expect(customers.every((item) => item.amount === 0 && item.planName === null)).toBe(true);
    // A purchase creates its customer first, at the same instant.
    const sale = advanceDemo(world, now).feed;
    expect(sale.slice(0, 3).map((item) => item.kind)).toEqual(["payment", "new", "customer"]);
  });

  it("counts the customers created today", () => {
    const later = simulate(world, 40).states.at(-1)!;
    const today = calendarDay(new Date(later.generatedAt), options.timeZone);
    const createdToday = later.feed.filter(
      (item) =>
        item.kind === "customer" &&
        calendarDay(new Date(item.occurredAt), options.timeZone) === today,
    );
    expect(later.metrics.customersCreatedToday).toBeGreaterThanOrEqual(createdToday.length);
    expect(later.metrics.customersCreatedToday).toBeGreaterThan(0);
  });
});

describe("demo of several accounts", () => {
  const two = parseDemoOptions({ accounts: "2" }).options;
  const worlds = createDemoWorlds(two, now);
  const state = demoState(worlds, now);

  it("shows two products of one company, taking turns", () => {
    expect(state.screen.name).toBe("Acme Inc.");
    expect(state.accounts.map((account) => account.name)).toEqual(["Acme Analytics", "Acme Mail"]);
    expect(state.screen.settings.rotation.enabled).toBe(true);
    expect(state.views.map((view) => view.accountId)).toEqual(["demo", "demo-mail"]);
  });

  it("adds their numbers up, like the server", () => {
    const [first, second] = state.views;
    expect(state.metrics.mrr).toBe(first.metrics.mrr + second.metrics.mrr);
    expect(state.metrics.revenue.monthToDate).toBe(
      first.metrics.revenue.monthToDate + second.metrics.revenue.monthToDate,
    );
    expect(state.series.mrr.at(-1)?.value).toBe(state.metrics.mrr);
    expect(first.series.mrr.at(-1)?.value).toBe(first.metrics.mrr);
    expect(state.screen.settings.goal).toBe(DEMO_GOAL * 2);
    expectConsistent(state);
  });

  it("keeps the first account as the demo of a single one", () => {
    expect(state.views[0].metrics).toEqual(demoState([createDemoWorld(options, now)], now).metrics);
  });

  it("merges their activity, newest first", () => {
    expect(new Set(state.feed.map((item) => item.accountId))).toEqual(
      new Set(["demo", "demo-mail"]),
    );
    const times = state.feed.map((item) => item.occurredAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  it("lets one account play at each turn, and both at once every third turn", () => {
    const played = (turn: number) =>
      advanceDemoWorlds(worlds, turn, now).map((world, index) => world !== worlds[index]);
    expect(played(0)).toEqual([true, false]);
    expect(played(1)).toEqual([false, true]);
    expect(played(2)).toEqual([true, true]);
  });
});

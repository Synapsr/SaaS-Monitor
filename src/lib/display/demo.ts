import { BUILD_ID } from "@/lib/build-id";
import {
  addDays,
  calendarDay,
  chartDays,
  daysInRange,
  displayCalendar,
  monthOf,
} from "@/lib/display/calendar";
import {
  createRandom,
  pick,
  pickWeighted,
  poisson,
  randomBetween,
  randomInt,
  type Random,
} from "@/lib/display/random";
import type {
  DisplayMetrics,
  DisplayState,
  FeedItem,
  MrrMovementKind,
  SeriesPoint,
} from "@/lib/display/types";
import { DAY_MS } from "@/lib/durations";
import { toMinorUnits } from "@/lib/money";
import {
  ACCENTS,
  CHART_RANGES,
  defaultScreenSettings,
  isTimeZone,
  SOUND_PACKS,
  type Accent,
  type ChartRange,
  type SoundPack,
} from "@/lib/screens/settings";

/**
 * The demo screen of a fictional SaaS, "Acme Analytics": a year of history ending just below a
 * $15k goal, then new activity every few seconds. Everything derives from one seeded event log,
 * so every number agrees with the others and the server and the browser render the same thing.
 */

/** Picked so that the history ends about $300 below the goal, crossed a minute after loading. */
const DEMO_SEED = 70;
const SCREEN_NAME = "Acme Analytics";
const DEMO_CURRENCY = "usd";
/** The goal the demo crosses within its first minutes, in major units like `settings.goal`. */
export const DEMO_GOAL = 15_000;

export interface DemoOptions {
  accent: Accent;
  /** `null` mutes the demo (`?sound=off`). */
  soundPack: SoundPack | null;
  showCustomerNames: boolean;
  chartRange: ChartRange;
  timeZone: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Reads `/d/demo?accent=violet&sound=arcade&names=1&range=12m&tz=Europe/Paris&preview=1`. */
export function parseDemoOptions(params: SearchParams): { options: DemoOptions; preview: boolean } {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const oneOf = <T extends string>(values: readonly T[], value: string | undefined) =>
    values.find((candidate) => candidate === value);

  const sound = read("sound");
  const timeZone = read("tz");
  return {
    options: {
      accent: oneOf(ACCENTS, read("accent")) ?? "emerald",
      soundPack: sound === "off" ? null : (oneOf(SOUND_PACKS, sound) ?? "register"),
      showCustomerNames: read("names") === "1",
      chartRange: oneOf(CHART_RANGES, read("range")) ?? "90d",
      timeZone: timeZone && isTimeZone(timeZone) ? timeZone : "America/New_York",
    },
    preview: read("preview") === "1",
  };
}

const PLANS = [
  { name: "Starter", price: 2_900 },
  { name: "Pro", price: 7_900 },
  { name: "Team", price: 19_900 },
  { name: "Scale", price: 49_000 },
] as const;
const PLAN_WEIGHTS = [0.42, 0.4, 0.14, 0.04];
const TEAM_PLAN = 2;
const AVERAGE_PRICE = PLANS.reduce((sum, plan, index) => sum + plan.price * PLAN_WEIGHTS[index], 0);

const COUNTRIES = [
  ["US", 30],
  ["GB", 10],
  ["DE", 9],
  ["FR", 8],
  ["CA", 6],
  ["NL", 5],
  ["AU", 4],
  ["SE", 3],
  ["ES", 3],
  ["IT", 3],
  ["BR", 3],
  ["IN", 3],
  ["JP", 2],
  ["CH", 2],
  ["IE", 2],
  ["PL", 2],
  ["DK", 1],
  ["SG", 1],
  ["NZ", 1],
  ["MX", 1],
] as const;

const COMPANIES = [
  "Brightwave",
  "Kestrel Data",
  "Fernhill Studio",
  "Oakline Legal",
  "Nimbus Travel",
  "Juniper Health",
  "Atlas Robotics",
  "Lumen & Co",
  "Pinecrest Media",
  "Quill & Ink",
  "Tidewater Labs",
  "Copperleaf",
  "Bluebird Dental",
  "Northstar Fitness",
  "Meridian Freight",
  "Saltbox Coffee",
  "Wildflower Events",
  "Ironwood Capital",
  "Mosaic Learning",
  "Clearwater Clinics",
  "Redwood Realty",
  "Maple & Main",
  "Foxglove Design",
  "Granite Peak",
  "Sundial Solar",
  "Brook & Stone",
  "Aurora Bikes",
  "Cobalt Games",
  "Driftwood Hotels",
  "Emberly Bakery",
  "Fable Books",
  "Glasshouse Studio",
  "Hearth Homes",
  "Kindred Care",
  "Lighthouse Schools",
  "Marigold Florist",
  "Nomad Coworking",
  "Odyssey Tours",
  "Riverbend Farms",
  "Summit Physio",
  "Trellis Garden",
  "Velvet Audio",
] as const;

/** MRR the history steers towards (days before now → cents): a good year, a great quarter. */
const TRAJECTORY: readonly (readonly [number, number])[] = [
  [372, 320_000],
  [180, 560_000],
  [90, 900_000],
  [0, 1_468_000],
];
const HISTORY_DAYS = TRAJECTORY[0][0];
/** Subscriptions renew every 30 days: close enough to monthly for a demo. */
const RENEWAL_PERIOD = 30 * DAY_MS;
const FEED_SIZE = 30;
const CHURN_MEMORY = 100;

/** Daily probabilities, per active customer (or per churned one for reactivations). */
const DAILY_RATES = { cancel: 0.0009, upgrade: 0.0007, downgrade: 0.0003, reactivate: 0.0015 };

interface DemoCustomer {
  id: number;
  name: string;
  country: string;
  plan: number;
  renewsAt: number;
}

type MonthMovements = DisplayMetrics["thisMonth"];

export interface DemoWorld {
  readonly options: DemoOptions;
  /** State of the seeded generator: the world evolves identically wherever it is resumed. */
  readonly seed: number;
  readonly sequence: number;
  readonly mrr: number;
  readonly customers: readonly DemoCustomer[];
  readonly churned: readonly DemoCustomer[];
  readonly trials: number;
  /** MRR at the end of each calendar day that changed it (screen time zone). */
  readonly mrrByDay: Readonly<Record<string, number>>;
  readonly revenueByDay: Readonly<Record<string, number>>;
  readonly movementsByMonth: Readonly<Record<string, MonthMovements>>;
  /** Most recent first. */
  readonly feed: readonly FeedItem[];
  /** Events played by the simulator after the history, i.e. "live" ones. */
  readonly liveEvents: number;
}

/** A world being changed: collections are copies, objects inside are replaced, never mutated. */
interface Draft {
  options: DemoOptions;
  sequence: number;
  mrr: number;
  customers: DemoCustomer[];
  churned: DemoCustomer[];
  trials: number;
  mrrByDay: Record<string, number>;
  revenueByDay: Record<string, number>;
  movementsByMonth: Record<string, MonthMovements>;
  feed: FeedItem[];
}

function toDraft(world: DemoWorld): Draft {
  return {
    options: world.options,
    sequence: world.sequence,
    mrr: world.mrr,
    customers: [...world.customers],
    churned: [...world.churned],
    trials: world.trials,
    mrrByDay: { ...world.mrrByDay },
    revenueByDay: { ...world.revenueByDay },
    movementsByMonth: { ...world.movementsByMonth },
    feed: [...world.feed],
  };
}

const emptyMonth: MonthMovements = {
  new: 0,
  expansion: 0,
  reactivation: 0,
  contraction: 0,
  churn: 0,
  net: 0,
  newCustomers: 0,
};

function dayOf(draft: Draft, at: number): string {
  return calendarDay(new Date(at), draft.options.timeZone);
}

function record(
  draft: Draft,
  kind: FeedItem["kind"],
  amount: number,
  customer: DemoCustomer,
  at: number,
  live: boolean,
) {
  draft.sequence += 1;
  draft.feed.unshift({
    id: `${kind === "payment" ? "payment" : "movement"}:demo-${draft.sequence}`,
    kind,
    amount,
    original: null,
    occurredAt: new Date(at).toISOString(),
    live,
    customerName: customer.name,
    country: customer.country,
    planName: PLANS[customer.plan].name,
    accountName: SCREEN_NAME,
  });
  if (draft.feed.length > FEED_SIZE) draft.feed.length = FEED_SIZE;
}

function recordPayment(draft: Draft, customer: DemoCustomer, at: number, live: boolean) {
  const amount = PLANS[customer.plan].price;
  const day = dayOf(draft, at);
  draft.revenueByDay[day] = (draft.revenueByDay[day] ?? 0) + amount;
  record(draft, "payment", amount, customer, at, live);
}

function recordMovement(
  draft: Draft,
  kind: MrrMovementKind,
  amount: number,
  customer: DemoCustomer,
  at: number,
  live: boolean,
) {
  const day = dayOf(draft, at);
  const month = monthOf(day);
  const movements = draft.movementsByMonth[month] ?? emptyMonth;
  draft.movementsByMonth[month] = {
    ...movements,
    [kind]: movements[kind] + amount,
    net: movements.net + amount,
    newCustomers: movements.newCustomers + (kind === "new" ? 1 : 0),
  };
  draft.mrr += amount;
  draft.mrrByDay[day] = draft.mrr;
  record(draft, kind, amount, customer, at, live);
}

function newCustomer(draft: Draft, random: Random, at: number, plan?: number): DemoCustomer {
  draft.sequence += 1;
  return {
    id: draft.sequence,
    name: pick(random, COMPANIES),
    country: pickWeighted(random, COUNTRIES),
    plan:
      plan ??
      pickWeighted(
        random,
        PLAN_WEIGHTS.map((weight, index) => [index, weight] as const),
      ),
    renewsAt: at + RENEWAL_PERIOD,
  };
}

function signUp(draft: Draft, random: Random, at: number, live: boolean, plan?: number) {
  const customer = newCustomer(draft, random, at, plan);
  draft.customers.push(customer);
  // The subscription starts and its first invoice is paid at once, like a Stripe Checkout.
  recordMovement(draft, "new", PLANS[customer.plan].price, customer, at, live);
  recordPayment(draft, customer, at, live);
}

function renew(draft: Draft, customerId: number, at: number, live: boolean) {
  const index = draft.customers.findIndex((customer) => customer.id === customerId);
  if (index === -1) return;
  const customer = { ...draft.customers[index], renewsAt: at + RENEWAL_PERIOD };
  draft.customers[index] = customer;
  recordPayment(draft, customer, at, live);
}

function changePlan(draft: Draft, random: Random, step: 1 | -1, at: number, live: boolean) {
  const candidates = draft.customers
    .map((customer, index) => ({ customer, index }))
    .filter(({ customer }) => PLANS[customer.plan + step] !== undefined);
  if (candidates.length === 0) return;
  const { customer, index } = pick(random, candidates);
  const updated = { ...customer, plan: customer.plan + step };
  draft.customers[index] = updated;
  const change = PLANS[updated.plan].price - PLANS[customer.plan].price;
  recordMovement(draft, step > 0 ? "expansion" : "contraction", change, updated, at, live);
}

function cancel(draft: Draft, random: Random, at: number, live: boolean) {
  if (draft.customers.length <= 1) return;
  const index = Math.floor(random() * draft.customers.length);
  const [customer] = draft.customers.splice(index, 1);
  draft.churned.push(customer);
  if (draft.churned.length > CHURN_MEMORY) draft.churned.shift();
  recordMovement(draft, "churn", -PLANS[customer.plan].price, customer, at, live);
}

function reactivate(draft: Draft, random: Random, at: number, live: boolean) {
  if (draft.churned.length === 0) return;
  const index = Math.floor(random() * draft.churned.length);
  const [churned] = draft.churned.splice(index, 1);
  const customer = { ...churned, renewsAt: at + RENEWAL_PERIOD };
  draft.customers.push(customer);
  recordMovement(draft, "reactivation", PLANS[customer.plan].price, customer, at, live);
  recordPayment(draft, customer, at, live);
}

/** Target MRR `daysAgo` days before now, interpolated geometrically between anchors. */
function targetMrr(daysAgo: number): number {
  for (let index = 1; index < TRAJECTORY.length; index += 1) {
    const [fromDays, fromMrr] = TRAJECTORY[index - 1];
    const [toDays, toMrr] = TRAJECTORY[index];
    if (daysAgo >= toDays) {
      const progress = (fromDays - daysAgo) / (fromDays - toDays);
      return fromMrr * (toMrr / fromMrr) ** Math.min(1, Math.max(0, progress));
    }
  }
  return TRAJECTORY[TRAJECTORY.length - 1][1];
}

type HistoryEvent =
  | { at: number; type: "renew"; customerId: number }
  | { at: number; type: "signUp" | "upgrade" | "downgrade" | "cancel" | "reactivate" };

/** One day of history: renewals that fall due, then random events steered by the trajectory. */
function simulateDay(draft: Draft, random: Random, start: number, end: number, now: number) {
  const events: HistoryEvent[] = [];
  for (const customer of draft.customers) {
    for (let at = customer.renewsAt; at < end; at += RENEWAL_PERIOD) {
      events.push({ at, type: "renew", customerId: customer.id });
    }
  }

  const customers = draft.customers.length;
  // New signups close most of the gap to the trajectory, which keeps the curve on course.
  const expectedChurn = customers * DAILY_RATES.cancel * AVERAGE_PRICE;
  const gap = targetMrr((now - end) / DAY_MS) - draft.mrr + expectedChurn;
  const counts = {
    signUp: poisson(random, Math.min(8, Math.max(0.15, (gap / AVERAGE_PRICE) * 0.7))),
    upgrade: poisson(random, customers * DAILY_RATES.upgrade),
    downgrade: poisson(random, customers * DAILY_RATES.downgrade),
    cancel: poisson(random, customers * DAILY_RATES.cancel),
    reactivate: poisson(random, draft.churned.length * DAILY_RATES.reactivate),
  };
  for (const [type, count] of Object.entries(counts) as [keyof typeof counts, number][]) {
    for (let index = 0; index < count; index += 1) {
      events.push({ at: randomBetween(random, start, end), type });
    }
  }

  events.sort((a, b) => a.at - b.at);
  for (const event of events) {
    const at = Math.round(event.at);
    if (event.type === "renew") renew(draft, event.customerId, at, false);
    else if (event.type === "signUp") signUp(draft, random, at, false);
    else if (event.type === "upgrade") changePlan(draft, random, 1, at, false);
    else if (event.type === "downgrade") changePlan(draft, random, -1, at, false);
    else if (event.type === "cancel") cancel(draft, random, at, false);
    else reactivate(draft, random, at, false);
  }
}

/** Builds the demo's history up to `now`. Same options, time and seed: same world. */
export function createDemoWorld(options: DemoOptions, now: Date, seed = DEMO_SEED): DemoWorld {
  const random = createRandom(seed);
  const end = now.getTime();
  const start = end - HISTORY_DAYS * DAY_MS;
  const draft: Draft = {
    options,
    sequence: 0,
    mrr: 0,
    customers: [],
    churned: [],
    trials: randomInt(random, 5, 9),
    mrrByDay: {},
    revenueByDay: {},
    movementsByMonth: {},
    feed: [],
  };

  // Customers from before the history: their subscriptions renew during the first month.
  while (draft.mrr < targetMrr(HISTORY_DAYS)) {
    const customer = newCustomer(draft, random, start);
    draft.customers.push({ ...customer, renewsAt: start + random() * RENEWAL_PERIOD });
    draft.mrr += PLANS[customer.plan].price;
  }
  draft.mrrByDay[dayOf(draft, start)] = draft.mrr;

  for (let day = start; day < end; day += DAY_MS) {
    simulateDay(draft, random, day, Math.min(end, day + DAY_MS), end);
  }
  forgetOldDays(draft, dayOf(draft, end));
  return { ...draft, seed: random.state, liveEvents: 0 };
}

type LiveEvent = "renew" | "signUp" | "upgrade" | "downgrade" | "cancel" | "reactivate";

/** Below the goal the demo leans towards growth, so the milestone arrives within minutes. */
const OPENING_MIX: readonly (readonly [LiveEvent, number])[] = [
  ["renew", 34],
  ["signUp", 38],
  ["upgrade", 18],
  ["reactivate", 3],
  ["downgrade", 3],
  ["cancel", 4],
];
const STEADY_MIX: readonly (readonly [LiveEvent, number])[] = [
  ["renew", 50],
  ["signUp", 24],
  ["upgrade", 10],
  ["reactivate", 2],
  ["downgrade", 5],
  ["cancel", 9],
];

function play(draft: Draft, random: Random, event: LiveEvent, at: number, plan?: number) {
  if (event === "renew") renew(draft, pick(random, draft.customers).id, at, true);
  else if (event === "signUp") signUp(draft, random, at, true, plan);
  else if (event === "upgrade") changePlan(draft, random, 1, at, true);
  else if (event === "downgrade") changePlan(draft, random, -1, at, true);
  else if (event === "cancel") cancel(draft, random, at, true);
  else reactivate(draft, random, at, true);
}

/** Plays the next live event at `now`, as the sync engine would have detected it. */
export function advanceDemo(world: DemoWorld, now: Date): DemoWorld {
  const random = createRandom(world.seed);
  const at = now.getTime();
  const goal = toMinorUnits(DEMO_GOAL, DEMO_CURRENCY);

  // The first event always shows the best moment: a new customer, paid on the spot.
  const event =
    world.liveEvents === 0
      ? "signUp"
      : pickWeighted(random, world.mrr < goal ? OPENING_MIX : STEADY_MIX);
  let draft = toDraft(world);
  play(draft, random, event, at, world.liveEvents === 0 ? TEAM_PLAN : undefined);
  // Once the goal has been celebrated, the demo never falls back below it.
  if (world.mrr >= goal && draft.mrr < goal) {
    draft = toDraft(world);
    play(draft, random, "renew", at);
  }
  // Visitors keep starting trials, and some signups convert one.
  if (event === "signUp" && draft.trials > 0 && random() < 0.4) draft.trials -= 1;
  else if (random() < 0.1) draft.trials += 1;

  forgetOldDays(draft, dayOf(draft, at));
  return { ...draft, seed: random.state, liveEvents: world.liveEvents + 1 };
}

/** Delay before the next live event: 12 to 25 seconds, and a quick first one. */
export function nextDemoDelay(world: DemoWorld): number {
  if (world.liveEvents === 0) return 5_000;
  return Math.round(randomBetween(createRandom(world.seed ^ 0x5bd1e995), 12_000, 25_000));
}

/** Keeps a demo left open for weeks from growing: only the days a screen can show remain. */
function forgetOldDays(draft: Draft, today: string) {
  const oldestMrrDay = addDays(today, -(HISTORY_DAYS + 1));
  const carried = mrrAt(draft.mrrByDay, oldestMrrDay);
  for (const day of Object.keys(draft.mrrByDay)) {
    if (day < oldestMrrDay) delete draft.mrrByDay[day];
  }
  draft.mrrByDay[oldestMrrDay] ??= carried;

  const oldestRevenueDay = addDays(today, -70);
  for (const day of Object.keys(draft.revenueByDay)) {
    if (day < oldestRevenueDay) delete draft.revenueByDay[day];
  }
  const oldestMonth = monthOf(displayCalendar(today).previousMonthStart);
  for (const month of Object.keys(draft.movementsByMonth)) {
    if (month < oldestMonth) delete draft.movementsByMonth[month];
  }
}

/** MRR at the end of `day`: the last recorded change on or before it. */
function mrrAt(mrrByDay: Readonly<Record<string, number>>, day: string): number {
  let latest: string | undefined;
  for (const candidate of Object.keys(mrrByDay)) {
    if (candidate <= day && (latest === undefined || candidate > latest)) latest = candidate;
  }
  if (latest !== undefined) return mrrByDay[latest];
  const first = Object.keys(mrrByDay).sort()[0];
  return first === undefined ? 0 : mrrByDay[first];
}

function mrrSeries(mrrByDay: Readonly<Record<string, number>>, days: readonly string[]) {
  let value = mrrAt(mrrByDay, days[0]);
  return days.map((date): SeriesPoint => {
    value = mrrByDay[date] ?? value;
    return { date, value };
  });
}

/** The `DisplayState` a real screen showing this world would receive at `now`. */
export function demoState(world: DemoWorld, now: Date): DisplayState {
  const { options } = world;
  const today = calendarDay(now, options.timeZone);
  const calendar = displayCalendar(today);
  const revenueOn = (day: string) => world.revenueByDay[day] ?? 0;
  const revenueBetween = (from: string, to: string) =>
    daysInRange(from, to).reduce((sum, day) => sum + revenueOn(day), 0);
  const customers = world.customers.length;

  return {
    version: BUILD_ID,
    generatedAt: now.toISOString(),
    screen: {
      name: SCREEN_NAME,
      settings: {
        ...defaultScreenSettings,
        currency: DEMO_CURRENCY,
        timeZone: options.timeZone,
        goal: DEMO_GOAL,
        sound: {
          ...defaultScreenSettings.sound,
          enabled: options.soundPack !== null,
          pack: options.soundPack ?? defaultScreenSettings.sound.pack,
        },
        showCustomerNames: options.showCustomerNames,
        chartRange: options.chartRange,
        accent: options.accent,
      },
    },
    currency: DEMO_CURRENCY,
    status: "ready",
    accounts: [{ id: "demo", name: SCREEN_NAME, status: "ready", livemode: true }],
    metrics: {
      mrr: world.mrr,
      mrr30DaysAgo: mrrAt(world.mrrByDay, calendar.thirtyDaysAgo),
      arr: world.mrr * 12,
      activeCustomers: customers,
      trialingSubscriptions: world.trials,
      arpu: customers > 0 ? Math.round(world.mrr / customers) : 0,
      revenue: {
        today: revenueOn(today),
        yesterday: revenueOn(calendar.yesterday),
        monthToDate: revenueBetween(calendar.monthStart, today),
        previousMonthToDate: revenueBetween(
          calendar.previousMonthStart,
          calendar.previousMonthCutoff,
        ),
      },
      thisMonth: world.movementsByMonth[monthOf(today)] ?? emptyMonth,
    },
    series: { mrr: mrrSeries(world.mrrByDay, chartDays(today, options.chartRange)) },
    feed: world.feed.map((item) =>
      options.showCustomerNames ? item : { ...item, customerName: null },
    ),
    testEvent: null,
    warnings: [],
  };
}

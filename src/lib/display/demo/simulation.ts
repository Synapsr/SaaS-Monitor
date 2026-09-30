import { addDays, calendarDay, displayCalendar, monthOf } from "@/lib/display/calendar";
import {
  AVERAGE_PRICE,
  COMPANIES,
  COUNTRIES,
  DEMO_BUSINESSES,
  DEMO_CURRENCY,
  DEMO_GOAL,
  PLAN_WEIGHTS,
  PLANS,
  TEAM_PLAN,
  type DemoBusiness,
} from "@/lib/display/demo/business";
import type { DemoOptions } from "@/lib/display/demo/options";
import {
  createRandom,
  pick,
  pickWeighted,
  poisson,
  randomBetween,
  randomInt,
  type Random,
} from "@/lib/display/random";
import type { DisplayMetrics, FeedItem, MrrMovementKind } from "@/lib/display/types";
import { DAY_MS } from "@/lib/durations";
import { toMinorUnits } from "@/lib/money";

/*
 * The demo's world: a year of history ending just below the goal, then new activity every few
 * seconds. Everything derives from one seeded event log, so every number agrees with the others
 * and the server and the browser build the same world.
 */

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

/*
 * Visitors who sign up without paying yet: new Stripe customers. They come from a random sequence
 * of their own, which leaves the rest of the world (and its seeds) as it was.
 */
const LEADS_PER_DAY = 3;
/** Share of live events that come with a sign-up a moment earlier. */
const LIVE_LEAD_CHANCE = 0.3;
const LEADS_SALT = 0x1ead5;

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
  readonly business: DemoBusiness;
  /** State of the seeded generator: the world evolves identically wherever it is resumed. */
  readonly seed: number;
  /** State of the generator of sign-ups. */
  readonly leadSeed: number;
  readonly sequence: number;
  readonly mrr: number;
  readonly customers: readonly DemoCustomer[];
  readonly churned: readonly DemoCustomer[];
  readonly trials: number;
  /** MRR at the end of each calendar day that changed it (screen time zone). */
  readonly mrrByDay: Readonly<Record<string, number>>;
  readonly revenueByDay: Readonly<Record<string, number>>;
  readonly movementsByMonth: Readonly<Record<string, MonthMovements>>;
  /** Stripe customers created each day, paying or not. */
  readonly customersByDay: Readonly<Record<string, number>>;
  /** Most recent first. */
  readonly feed: readonly FeedItem[];
  /** Events played by the simulator after the history, i.e. "live" ones. */
  readonly liveEvents: number;
}

/** A world being changed: collections are copies, objects inside are replaced, never mutated. */
interface Draft {
  options: DemoOptions;
  business: DemoBusiness;
  sequence: number;
  mrr: number;
  customers: DemoCustomer[];
  churned: DemoCustomer[];
  trials: number;
  mrrByDay: Record<string, number>;
  revenueByDay: Record<string, number>;
  movementsByMonth: Record<string, MonthMovements>;
  customersByDay: Record<string, number>;
  feed: FeedItem[];
}

/** A copy of a world, or of a draft, to change. */
function toDraft(world: DemoWorld | Draft): Draft {
  return {
    options: world.options,
    business: world.business,
    sequence: world.sequence,
    mrr: world.mrr,
    customers: [...world.customers],
    churned: [...world.churned],
    trials: world.trials,
    mrrByDay: { ...world.mrrByDay },
    revenueByDay: { ...world.revenueByDay },
    movementsByMonth: { ...world.movementsByMonth },
    customersByDay: { ...world.customersByDay },
    feed: [...world.feed],
  };
}

/** A month without MRR movements. */
export const EMPTY_MONTH: MonthMovements = {
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
  const source = kind === "payment" || kind === "customer" ? kind : "movement";
  draft.feed.unshift({
    id: `${source}:${draft.business.id}-${draft.sequence}`,
    kind,
    amount,
    original: null,
    occurredAt: new Date(at).toISOString(),
    live,
    customerKey: `${draft.business.id}-${customer.id}`,
    customerName: customer.name,
    customerEmail: null,
    country: customer.country,
    planName: kind === "customer" ? null : PLANS[customer.plan].name,
    connect: null,
    // Its checkouts record a subscription and its payment at once: nothing to wait for.
    customerSubscribed: null,
    // Most SaaS customers leave at the end of the period they paid for.
    churn:
      kind === "churn"
        ? { reason: "scheduled", endsAt: new Date(at + RENEWAL_PERIOD).toISOString() }
        : null,
    accountId: draft.business.id,
    accountName: draft.business.name,
  });
  if (draft.feed.length > FEED_SIZE) draft.feed.length = FEED_SIZE;
}

/** A customer created in Stripe: at sign-up, or at checkout. */
function recordCustomer(draft: Draft, customer: DemoCustomer, at: number, live: boolean) {
  const day = dayOf(draft, at);
  draft.customersByDay[day] = (draft.customersByDay[day] ?? 0) + 1;
  record(draft, "customer", 0, customer, at, live);
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
  const movements = draft.movementsByMonth[month] ?? EMPTY_MONTH;
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
  // The customer is created, the subscription starts and its first invoice is paid at once, like
  // a Stripe Checkout.
  recordCustomer(draft, customer, at, live);
  recordMovement(draft, "new", PLANS[customer.plan].price, customer, at, live);
  recordPayment(draft, customer, at, live);
}

/** A visitor signs up, without paying yet. */
function lead(draft: Draft, leads: Random, at: number, live: boolean) {
  draft.sequence += 1;
  const visitor: DemoCustomer = {
    id: draft.sequence,
    name: pick(leads, COMPANIES),
    country: pickWeighted(leads, COUNTRIES),
    plan: 0,
    renewsAt: at,
  };
  recordCustomer(draft, visitor, at, live);
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
  | { at: number; type: "signUp" | "upgrade" | "downgrade" | "cancel" | "reactivate" | "lead" };

/** One day of history: renewals that fall due, then random events steered by the trajectory. */
function simulateDay(
  draft: Draft,
  random: Random,
  leads: Random,
  start: number,
  end: number,
  now: number,
) {
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
  const leadCount = poisson(leads, LEADS_PER_DAY * ((end - start) / DAY_MS));
  for (let index = 0; index < leadCount; index += 1) {
    events.push({ at: randomBetween(leads, start, end), type: "lead" });
  }

  events.sort((a, b) => a.at - b.at);
  for (const event of events) {
    const at = Math.round(event.at);
    if (event.type === "renew") renew(draft, event.customerId, at, false);
    else if (event.type === "signUp") signUp(draft, random, at, false);
    else if (event.type === "upgrade") changePlan(draft, random, 1, at, false);
    else if (event.type === "downgrade") changePlan(draft, random, -1, at, false);
    else if (event.type === "cancel") cancel(draft, random, at, false);
    else if (event.type === "lead") lead(draft, leads, at, false);
    else reactivate(draft, random, at, false);
  }
}

/** Builds the history of a demo account up to `now`. Same options, time and seed: same world. */
export function createDemoWorld(
  options: DemoOptions,
  now: Date,
  business: DemoBusiness = DEMO_BUSINESSES[0],
): DemoWorld {
  const random = createRandom(business.seed);
  const leads = createRandom(business.seed ^ LEADS_SALT);
  const end = now.getTime();
  const start = end - HISTORY_DAYS * DAY_MS;
  const draft: Draft = {
    options,
    business,
    sequence: 0,
    mrr: 0,
    customers: [],
    churned: [],
    trials: randomInt(random, 5, 9),
    mrrByDay: {},
    revenueByDay: {},
    movementsByMonth: {},
    customersByDay: {},
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
    simulateDay(draft, random, leads, day, Math.min(end, day + DAY_MS), end);
  }
  forgetOldDays(draft, dayOf(draft, end));
  return { ...draft, seed: random.state, leadSeed: leads.state, liveEvents: 0 };
}

/** The accounts of the demo screen: one, or two with `?accounts=2`. */
export function createDemoWorlds(options: DemoOptions, now: Date): DemoWorld[] {
  return DEMO_BUSINESSES.slice(0, options.accounts).map((business) =>
    createDemoWorld(options, now, business),
  );
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
  const leads = createRandom(world.leadSeed);
  const at = now.getTime();
  const goal = toMinorUnits(DEMO_GOAL, DEMO_CURRENCY);

  // The first event always shows the best moment: a new customer, paid on the spot.
  const event =
    world.liveEvents === 0
      ? "signUp"
      : pickWeighted(random, world.mrr < goal ? OPENING_MIX : STEADY_MIX);
  const draft = toDraft(world);
  // Some events come with a sign-up a moment earlier: two moments in a row. Not the first one,
  // which shows a sale on its own.
  if (world.liveEvents > 0 && leads() < LIVE_LEAD_CHANCE) lead(draft, leads, at - 1_500, true);
  let next = toDraft(draft);
  play(next, random, event, at, world.liveEvents === 0 ? TEAM_PLAN : undefined);
  // Once the goal has been celebrated, the demo never falls back below it.
  if (world.mrr >= goal && next.mrr < goal) {
    next = toDraft(draft);
    play(next, random, "renew", at);
  }
  // Visitors keep starting trials, and some signups convert one.
  if (event === "signUp" && next.trials > 0 && random() < 0.4) next.trials -= 1;
  else if (random() < 0.1) next.trials += 1;

  forgetOldDays(next, dayOf(next, at));
  return { ...next, seed: random.state, leadSeed: leads.state, liveEvents: world.liveEvents + 1 };
}

/**
 * The accounts of the demo screen, a turn later: one account plays its next event, and every
 * third turn of a screen of several, all of them at once, which the screen announces one by one.
 */
export function advanceDemoWorlds(
  worlds: readonly DemoWorld[],
  turn: number,
  now: Date,
): DemoWorld[] {
  const together = worlds.length > 1 && turn % 3 === 2;
  return worlds.map((world, index) =>
    together || index === turn % worlds.length ? advanceDemo(world, now) : world,
  );
}

/** Delay before the demo's next turn. */
export function nextDemoWorldsDelay(worlds: readonly DemoWorld[], turn: number): number {
  return nextDemoDelay(worlds[turn % worlds.length]);
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
export function mrrAt(mrrByDay: Readonly<Record<string, number>>, day: string): number {
  let latest: string | undefined;
  for (const candidate of Object.keys(mrrByDay)) {
    if (candidate <= day && (latest === undefined || candidate > latest)) latest = candidate;
  }
  if (latest !== undefined) return mrrByDay[latest];
  const first = Object.keys(mrrByDay).sort()[0];
  return first === undefined ? 0 : mrrByDay[first];
}

import { eventPlays, itemEvent, momentPlays, type FeedEvent } from "@/lib/display/events";
import { diffFeed } from "@/lib/display/feed-diff";
import { recurringMetric } from "@/lib/display/metric";
import { crossedMilestone } from "@/lib/display/milestones";
import type { DisplayState, FeedItem } from "@/lib/display/types";
import { toMajorUnits, toMinorUnits } from "@/lib/money";
import type { Metric, ScreenSettings } from "@/lib/screens/settings";
import type { SoundEvent } from "@/lib/sounds";

/** Something worth a sound and a moment on screen. */
export type Moment =
  | { id: string; kind: "payment"; payment: FeedItem }
  | { id: string; kind: "movement"; movement: FeedItem }
  /** A Stripe customer created, who has not paid (yet). */
  | { id: string; kind: "customer"; customer: FeedItem }
  | {
      id: string;
      kind: "milestone";
      /** In minor units of `metric`, the screen's metric when it was crossed: "$1M ARR". */
      amount: number;
      metric: Metric;
      isGoal: boolean;
      /** The account that crossed it on a screen showing each on its own; `null` for the total. */
      accountId: string | null;
    }
  | {
      id: string;
      kind: "summary";
      /** The account whose burst it sums up: one summary per account of a screen. */
      accountId: string;
      /** The events of the items it sums up, each once. */
      events: FeedEvent[];
      payments: number;
      /** Subscription changes: new, upgraded, downgraded, canceled… */
      changes: number;
      customers: number;
      revenue: number;
      mrrChange: number;
    }
  | { id: string; kind: "test" };

/**
 * From this many moments of an account at once (e.g. after a reconnection), celebrate once with a
 * summary.
 */
const BURST_SIZE = 4;

/**
 * A payment and a subscription change of the same customer within this delay go together, and so
 * does the creation of the customer paying: Stripe Checkout creates all three at once.
 */
const SAME_CHECKOUT_MS = 10 * 60_000;

/**
 * What an item brings the account: a payment's amount, or only the fee of one made for a Stripe
 * Connect account, whose money is theirs.
 */
export function ownRevenue(item: FeedItem): number {
  return item.connect ? (item.connect.applicationFee ?? 0) : item.amount;
}

export function isMrrIncrease(item: FeedItem): boolean {
  return item.kind === "new" || item.kind === "expansion" || item.kind === "reactivation";
}

/**
 * Matches on the customer's key: a payment takes its name and country from the charge (billing
 * details, card), which may differ from the Stripe customer's, and its plan from their main one.
 */
function sameCheckout(a: FeedItem, b: FeedItem): boolean {
  return (
    a.customerKey !== null &&
    a.customerKey === b.customerKey &&
    Math.abs(Date.parse(a.occurredAt) - Date.parse(b.occurredAt)) <= SAME_CHECKOUT_MS
  );
}

/**
 * Turns fresh feed items (oldest first) into moments, played in the order things happened. Each
 * account of a screen is planned on its own: its moments name it, and a burst of one account
 * never swallows what another one did.
 */
export function planMoments(fresh: readonly FeedItem[]): Moment[] {
  // Not `Map.groupBy`: TVs and kiosks run browsers too old for it.
  const byAccount = new Map<string, FeedItem[]>();
  for (const item of fresh)
    byAccount.set(item.accountId, [...(byAccount.get(item.accountId) ?? []), item]);
  const groups = [...byAccount.values()].flatMap(planAccountMoments);
  // Stable: the groups of one account keep their order.
  return groups.sort((a, b) => a.at - b.at).flatMap((group) => group.moments);
}

/** Moments played one after the other, as early as the first thing they announce happened. */
interface MomentGroup {
  moments: Moment[];
  at: number;
}

/**
 * The moments of one account. A new subscription usually arrives with its first payment, and with
 * the creation of its customer: the subscription is announced first, then the payment that started
 * it, while the customer's creation goes without saying. Upgrades and comebacks paid at once go
 * the same way.
 */
function planAccountMoments(items: readonly FeedItem[]): MomentGroup[] {
  const payments = items.filter((item) => item.kind === "payment");
  const customers = items.filter((item) => item.kind === "customer");
  const movements = items.filter((item) => item.kind !== "payment" && item.kind !== "customer");

  // Each subscription that started or grew with a payment, and the payment: the customer's
  // closest in time, should they have paid twice.
  const paidWith = new Map<string, FeedItem>();
  const paid = new Set<string>();
  for (const movement of movements) {
    if (!isMrrIncrease(movement)) continue;
    const distance = (payment: FeedItem) =>
      Math.abs(Date.parse(payment.occurredAt) - Date.parse(movement.occurredAt));
    const [payment] = payments
      .filter((candidate) => !paid.has(candidate.id) && startedBy(movement, candidate))
      .sort((a, b) => distance(a) - distance(b));
    if (!payment) continue;
    paidWith.set(movement.id, payment);
    paid.add(payment.id);
  }
  const celebrated = [...payments, ...movements.filter(isMrrIncrease)];
  const absorbed = new Set(
    customers
      .filter((customer) => celebrated.some((item) => sameCheckout(item, customer)))
      .map((customer) => customer.id),
  );

  const groups = items.flatMap((item): MomentGroup[] => {
    if (paid.has(item.id) || absorbed.has(item.id)) return [];
    const at = Date.parse(item.occurredAt);
    switch (item.kind) {
      case "payment":
        return [{ at, moments: [{ id: item.id, kind: "payment", payment: item }] }];
      case "customer":
        return [{ at, moments: [{ id: item.id, kind: "customer", customer: item }] }];
      default: {
        const movement: Moment = { id: item.id, kind: "movement", movement: item };
        const payment = paidWith.get(item.id);
        if (!payment) return [{ at, moments: [movement] }];
        return [
          {
            at: Math.min(at, Date.parse(payment.occurredAt)),
            moments: [movement, { id: payment.id, kind: "payment", payment }],
          },
        ];
      }
    }
  });
  if (groups.length < BURST_SIZE) return groups;

  const sum = (list: FeedItem[]) => list.reduce((total, item) => total + ownRevenue(item), 0);
  const last = items[items.length - 1];
  const summary: Moment = {
    id: `summary:${last.id}`,
    kind: "summary",
    accountId: last.accountId,
    events: [...new Set(items.map(itemEvent))],
    payments: payments.length,
    changes: movements.length,
    customers: customers.length,
    revenue: sum(payments),
    mrrChange: sum(movements),
  };
  return [
    { at: Math.max(...items.map((item) => Date.parse(item.occurredAt))), moments: [summary] },
  ];
}

/**
 * Whether a payment started or grew a subscription: made by its customer around the same time.
 * A payment made for a Stripe Connect account never pays for the account's subscriptions.
 */
function startedBy(movement: FeedItem, payment: FeedItem): boolean {
  return payment.connect === null && sameCheckout(payment, movement);
}

/**
 * The first payment of a customer without a subscription may start one: Stripe activates it a few
 * seconds later, often after the display polled. It waits for the next state, to be announced
 * after its subscription rather than before it.
 */
function awaitsSubscription(item: FeedItem): boolean {
  return (
    item.kind === "payment" &&
    item.connect === null &&
    item.customerKey !== null &&
    item.customerSubscribed === false
  );
}

/**
 * The account a moment comes from, which a screen rotating between its accounts brings on screen
 * while it plays; `null` for the total, or for no account in particular.
 */
export function momentAccount(moment: Moment): string | null {
  switch (moment.kind) {
    case "payment":
      return moment.payment.accountId;
    case "movement":
      return moment.movement.accountId;
    case "customer":
      return moment.customer.accountId;
    case "summary":
    case "milestone":
      return moment.accountId;
    case "test":
      return null;
  }
}

/** What a display remembers between two states to detect what just happened. */
export interface MomentTracker {
  previous: DisplayState | null;
  seen: Set<string> | null;
  testEventId: string | null;
  /**
   * Ids of the milestone moments already played, so a value hovering around a milestone
   * celebrates it only once. They name the metric: $250K of MRR and of ARR are two milestones.
   */
  celebrated: ReadonlySet<string>;
  /** Payments waiting for the subscription they may start (see `awaitsSubscription`). */
  held: readonly FeedItem[];
}

export const initialMomentTracker: MomentTracker = {
  previous: null,
  seen: null,
  testEventId: null,
  celebrated: new Set(),
  held: [],
};

/**
 * Compares a new state with the previous one. The first state, and any state that follows an
 * import, a currency change or a change of the screen's accounts, only sets the baseline: moments
 * come from what happens next. A new metric or goal is a new baseline for milestones only. Events
 * the screen neither shows as moments nor plays are left out.
 */
export function trackMoments(
  tracker: MomentTracker,
  state: DisplayState,
): { tracker: MomentTracker; moments: Moment[] } {
  const { previous } = tracker;
  const comparable =
    previous !== null &&
    previous.status === "ready" &&
    state.status === "ready" &&
    previous.currency === state.currency &&
    showSameAccounts(previous, state);

  const { settings } = state.screen;
  const { fresh, seen } = diffFeed(comparable ? tracker.seen : null, state.feed);
  const played = fresh.filter((item) => eventPlays(itemEvent(item), settings));
  // Payments held by the previous state play now, after their subscription if it came.
  const candidates = comparable ? [...tracker.held, ...played] : played;
  const held = played.filter(
    (item) =>
      awaitsSubscription(item) &&
      !candidates.some((other) => isMrrIncrease(other) && startedBy(other, item)),
  );
  const moments = planMoments(candidates.filter((item) => !held.includes(item)));

  let celebrated = tracker.celebrated;
  if (comparable && showSameMetricAndGoal(previous, state) && eventPlays("milestone", settings)) {
    for (const moment of crossedMilestones(previous, state)) {
      if (celebrated.has(moment.id)) continue;
      celebrated = new Set(celebrated).add(moment.id);
      moments.push(moment);
    }
  }

  const testEventId = state.testEvent?.id ?? null;
  if (previous !== null && testEventId !== null && testEventId !== tracker.testEventId) {
    moments.push({ id: `test:${testEventId}`, kind: "test" });
  }

  return { tracker: { previous: state, seen, testEventId, celebrated, held }, moments };
}

/**
 * The milestones crossed between two states: of the total, with the screen's goal, and of each
 * account on a screen showing them one by one, which have no goal of their own.
 */
function crossedMilestones(previous: DisplayState, state: DisplayState): Moment[] {
  const { metric, goal, rotation } = state.screen.settings;
  const { fromMrr } = recurringMetric(metric);
  const { currency } = state;
  const byAccount = rotation.enabled ? state.views : [];
  const moments: Moment[] = [];

  if (byAccount.length < 2 || rotation.includeTotal) {
    const total = crossedMilestone(
      fromMrr(previous.metrics.mrr),
      fromMrr(state.metrics.mrr),
      goal,
      currency,
    );
    if (total !== null) {
      moments.push({
        id: `milestone:${metric}:${total}`,
        kind: "milestone",
        amount: total,
        metric,
        isGoal: goal !== null && total === toMinorUnits(goal, currency),
        accountId: null,
      });
    }
  }

  for (const view of byAccount) {
    const before = previous.views.find(({ accountId }) => accountId === view.accountId);
    if (!before) continue;
    const crossed = crossedMilestone(
      fromMrr(before.metrics.mrr),
      fromMrr(view.metrics.mrr),
      null,
      currency,
    );
    if (crossed === null) continue;
    moments.push({
      id: `milestone:${metric}:${view.accountId}:${crossed}`,
      kind: "milestone",
      amount: crossed,
      metric,
      isGoal: false,
      accountId: view.accountId,
    });
  }
  return moments;
}

/**
 * An account added to a screen brings its history at once: live items the screen never showed,
 * and MRR that may cross milestones. None of it just happened.
 */
function showSameAccounts(a: DisplayState, b: DisplayState): boolean {
  const ids = new Set(a.accounts.map((account) => account.id));
  return a.accounts.length === b.accounts.length && b.accounts.every(({ id }) => ids.has(id));
}

/**
 * Switching from MRR to ARR multiplies the value by twelve, crossing milestones that were never
 * reached, and a new goal may sit just below the value. Neither is progress: payments and
 * subscriptions keep their moments, but milestones start over from the new baseline.
 */
function showSameMetricAndGoal(a: DisplayState, b: DisplayState): boolean {
  return (
    a.screen.settings.metric === b.screen.settings.metric &&
    a.screen.settings.goal === b.screen.settings.goal
  );
}

/** The sound of a moment, when the screen's settings let it play (see `momentPlays`). */
export function momentSound(
  moment: Moment,
  settings: Pick<ScreenSettings, "events" | "sound" | "voice">,
): SoundEvent | null {
  if (!momentPlays(moment, settings, "sound")) return null;
  switch (moment.kind) {
    case "payment":
    case "test":
      return "payment";
    case "movement":
      return isMrrIncrease(moment.movement) ? "mrrUp" : "mrrDown";
    case "customer":
      return "customer";
    case "milestone":
      return "milestone";
    case "summary":
      if (moment.revenue > 0) return "payment";
      if (moment.mrrChange < 0) return "mrrDown";
      if (moment.mrrChange === 0 && moment.customers > 0) return "customer";
      return "mrrUp";
  }
}

/**
 * Confetti for money coming in, a bigger show for milestones, nothing for losses, nor for money
 * that only passes through for a Stripe Connect account.
 */
export type Celebration = "payment" | "milestone";

export function momentCelebration(moment: Moment): Celebration | null {
  switch (moment.kind) {
    case "milestone":
      return "milestone";
    case "payment":
      return moment.payment.connect ? null : "payment";
    case "test":
      return "payment";
    case "summary":
      return moment.revenue > 0 ? "payment" : null;
    case "movement":
    case "customer":
      return null;
  }
}

/**
 * The amount of a test celebration: a typical payment of this business, rounded, so that it reads
 * as a sample rather than as real money.
 */
export function testPaymentAmount(state: DisplayState): number {
  const { arpu } = state.metrics;
  const typical = arpu > 0 ? Math.max(1, Math.round(toMajorUnits(arpu, state.currency))) : 49;
  return toMinorUnits(typical, state.currency);
}

/** A milestone takes over the whole screen: it deserves its full show, whatever the setting. */
const MILESTONE_MS = 6500;
/** However many moments wait, each stays long enough to be read. */
const SHORTEST_MS = 3200;

/** A moment without a card only plays its sound and says its phrase: a breath is enough. */
const UNSEEN_MS = 2500;

/**
 * How long a moment lasts, from the screen's setting (`momentSeconds`) when it shows a card
 * (`seen`); shorter when others are waiting, to never lag behind.
 */
export function momentDuration(
  moment: Moment,
  waiting: number,
  { seconds, seen }: { seconds: number; seen: boolean },
): number {
  if (!seen) return UNSEEN_MS;
  const setting = seconds * 1000;
  const base = moment.kind === "milestone" ? Math.max(setting, MILESTONE_MS) : setting;
  return waiting > 0 ? Math.max(SHORTEST_MS, base * 0.5) : base;
}

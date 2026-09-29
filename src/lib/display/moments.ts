import { diffFeed } from "@/lib/display/feed-diff";
import { recurringMetric } from "@/lib/display/metric";
import { crossedMilestone } from "@/lib/display/milestones";
import type { DisplayState, FeedItem } from "@/lib/display/types";
import { toMinorUnits } from "@/lib/money";
import type { Metric, ScreenSettings } from "@/lib/screens/settings";
import type { SoundEvent } from "@/lib/sounds";

/** Something worth a sound and a moment on screen. */
export type Moment =
  | {
      id: string;
      kind: "payment";
      payment: FeedItem;
      /** The subscription change behind the payment, e.g. the new subscription it started. */
      movement: FeedItem | null;
    }
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
 * A payment and a subscription change of the same customer within this delay are one moment, and
 * so is the creation of the customer paying: Stripe Checkout creates all three at once.
 */
const SAME_CHECKOUT_MS = 10 * 60_000;

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
  const planned = [...byAccount.values()].flatMap((items) =>
    planAccountMoments(items).map((moment) => ({ moment, at: momentTime(moment, items) })),
  );
  // Stable: the moments of one account keep their order.
  return planned.sort((a, b) => a.at - b.at).map(({ moment }) => moment);
}

/**
 * The moments of one account. A new subscription usually arrives with its first payment, and
 * with the creation of its customer: they become a single moment instead of celebrations in a
 * row.
 */
function planAccountMoments(items: readonly FeedItem[]): Moment[] {
  const payments = items.filter((item) => item.kind === "payment");
  const customers = items.filter((item) => item.kind === "customer");
  const movements = items.filter((item) => item.kind !== "payment" && item.kind !== "customer");

  const merged = new Map<string, FeedItem>();
  for (const movement of movements) {
    if (!isMrrIncrease(movement)) continue;
    const payment = payments.find(
      (candidate) => !merged.has(candidate.id) && sameCheckout(candidate, movement),
    );
    if (payment) merged.set(payment.id, movement);
  }
  const celebrated = [...payments, ...movements.filter(isMrrIncrease)];
  const absorbed = new Set([
    ...[...merged.values()].map((movement) => movement.id),
    ...customers
      .filter((customer) => celebrated.some((item) => sameCheckout(item, customer)))
      .map((customer) => customer.id),
  ]);

  const moments = items.flatMap((item): Moment[] => {
    if (absorbed.has(item.id)) return [];
    switch (item.kind) {
      case "payment":
        return [
          { id: item.id, kind: "payment", payment: item, movement: merged.get(item.id) ?? null },
        ];
      case "customer":
        return [{ id: item.id, kind: "customer", customer: item }];
      default:
        return [{ id: item.id, kind: "movement", movement: item }];
    }
  });
  if (moments.length < BURST_SIZE) return moments;

  const sum = (list: FeedItem[]) => list.reduce((total, item) => total + item.amount, 0);
  const last = items[items.length - 1];
  return [
    {
      id: `summary:${last.id}`,
      kind: "summary",
      accountId: last.accountId,
      payments: payments.length,
      changes: movements.length,
      customers: customers.length,
      revenue: sum(payments),
      mrrChange: sum(movements),
    },
  ];
}

/** When the activity a moment announces happened, to play moments in order. */
function momentTime(moment: Moment, items: readonly FeedItem[]): number {
  switch (moment.kind) {
    case "payment":
      return Date.parse(moment.payment.occurredAt);
    case "movement":
      return Date.parse(moment.movement.occurredAt);
    case "customer":
      return Date.parse(moment.customer.occurredAt);
    default:
      return Math.max(...items.map((item) => Date.parse(item.occurredAt)));
  }
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
}

export const initialMomentTracker: MomentTracker = {
  previous: null,
  seen: null,
  testEventId: null,
  celebrated: new Set(),
};

/**
 * Compares a new state with the previous one. The first state, and any state that follows an
 * import, a currency change or a change of the screen's accounts, only sets the baseline: moments
 * come from what happens next. A new metric or goal is a new baseline for milestones only.
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

  const { fresh, seen } = diffFeed(comparable ? tracker.seen : null, state.feed);
  const moments = planMoments(fresh);

  let celebrated = tracker.celebrated;
  if (comparable && showSameMetricAndGoal(previous, state)) {
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

  return { tracker: { previous: state, seen, testEventId, celebrated }, moments };
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

/** The sound of a moment, and whether the screen's settings let it play. */
export function momentSound(moment: Moment, sound: ScreenSettings["sound"]): SoundEvent | null {
  if (!sound.enabled) return null;
  switch (moment.kind) {
    case "payment":
      return sound.onPayment ? "payment" : null;
    case "movement":
      if (isMrrIncrease(moment.movement)) return sound.onMrrUp ? "mrrUp" : null;
      return sound.onMrrDown ? "mrrDown" : null;
    case "customer":
      return sound.onCustomer ? "customer" : null;
    case "milestone":
      return "milestone";
    case "summary":
      if (moment.revenue > 0) return sound.onPayment ? "payment" : null;
      if (moment.mrrChange < 0) return sound.onMrrDown ? "mrrDown" : null;
      if (moment.mrrChange === 0 && moment.customers > 0) {
        return sound.onCustomer ? "customer" : null;
      }
      return sound.onMrrUp ? "mrrUp" : null;
    case "test":
      // The founder asked to hear it: only the master switch applies.
      return "payment";
  }
}

/** Confetti for money coming in, a bigger show for milestones, nothing for losses. */
export type Celebration = "payment" | "milestone";

export function momentCelebration(moment: Moment): Celebration | null {
  switch (moment.kind) {
    case "milestone":
      return "milestone";
    case "payment":
    case "test":
      return "payment";
    case "summary":
      return moment.revenue > 0 ? "payment" : null;
    case "movement":
    case "customer":
      return null;
  }
}

/** How long a moment stays on screen; shorter when others are waiting, to never lag behind. */
export function momentDuration(moment: Moment, waiting: number): number {
  const base =
    moment.kind === "milestone"
      ? 6500
      : moment.kind === "movement" || moment.kind === "customer"
        ? 4200
        : 5200;
  return waiting > 0 ? Math.max(3200, base * 0.7) : base;
}

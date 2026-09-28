import { diffFeed } from "@/lib/display/feed-diff";
import { crossedMilestone } from "@/lib/display/milestones";
import type { DisplayState, FeedItem } from "@/lib/display/types";
import { toMinorUnits } from "@/lib/money";
import type { ScreenSettings } from "@/lib/screens/settings";
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
  | { id: string; kind: "milestone"; amount: number; isGoal: boolean }
  | {
      id: string;
      kind: "summary";
      payments: number;
      /** Subscription changes: new, upgraded, downgraded, canceled… */
      changes: number;
      revenue: number;
      mrrChange: number;
    }
  | { id: string; kind: "test" };

/** From this many fresh items at once (e.g. after a reconnection), celebrate once with a summary. */
const BURST_SIZE = 4;

/** A payment and a subscription change of the same customer within this delay are one moment. */
const SAME_CHECKOUT_MS = 10 * 60_000;

export function isMrrIncrease(item: FeedItem): boolean {
  return item.kind === "new" || item.kind === "expansion" || item.kind === "reactivation";
}

function sameCheckout(payment: FeedItem, movement: FeedItem): boolean {
  return (
    payment.accountName === movement.accountName &&
    payment.planName === movement.planName &&
    payment.country === movement.country &&
    payment.customerName === movement.customerName &&
    Math.abs(Date.parse(payment.occurredAt) - Date.parse(movement.occurredAt)) <= SAME_CHECKOUT_MS
  );
}

/**
 * Turns fresh feed items (oldest first) into moments. A new subscription usually arrives with its
 * first payment: both become a single moment instead of two celebrations in a row.
 */
export function planMoments(fresh: readonly FeedItem[]): Moment[] {
  const payments = fresh.filter((item) => item.kind === "payment");
  const movements = fresh.filter((item) => item.kind !== "payment");

  if (fresh.length >= BURST_SIZE) {
    const sum = (items: FeedItem[]) => items.reduce((total, item) => total + item.amount, 0);
    return [
      {
        id: `summary:${fresh[fresh.length - 1].id}`,
        kind: "summary",
        payments: payments.length,
        changes: movements.length,
        revenue: sum(payments),
        mrrChange: sum(movements),
      },
    ];
  }

  const merged = new Map<string, FeedItem>();
  for (const movement of movements) {
    if (!isMrrIncrease(movement)) continue;
    const payment = payments.find(
      (candidate) => !merged.has(candidate.id) && sameCheckout(candidate, movement),
    );
    if (payment) merged.set(payment.id, movement);
  }
  const absorbed = new Set([...merged.values()].map((movement) => movement.id));

  return fresh.flatMap((item): Moment[] => {
    if (item.kind === "payment") {
      return [
        { id: item.id, kind: "payment", payment: item, movement: merged.get(item.id) ?? null },
      ];
    }
    return absorbed.has(item.id) ? [] : [{ id: item.id, kind: "movement", movement: item }];
  });
}

/** What a display remembers between two states to detect what just happened. */
export interface MomentTracker {
  previous: DisplayState | null;
  seen: Set<string> | null;
  testEventId: string | null;
  /** Milestones already celebrated, so MRR hovering around one celebrates it only once. */
  celebrated: ReadonlySet<number>;
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
 * come from what happens next.
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
  const milestone = comparable
    ? crossedMilestone(
        previous.metrics.mrr,
        state.metrics.mrr,
        state.screen.settings.goal,
        state.currency,
      )
    : null;
  if (milestone !== null && !celebrated.has(milestone)) {
    celebrated = new Set(celebrated).add(milestone);
    const goal = state.screen.settings.goal;
    moments.push({
      id: `milestone:${milestone}`,
      kind: "milestone",
      amount: milestone,
      isGoal: goal !== null && milestone === toMinorUnits(goal, state.currency),
    });
  }

  const testEventId = state.testEvent?.id ?? null;
  if (previous !== null && testEventId !== null && testEventId !== tracker.testEventId) {
    moments.push({ id: `test:${testEventId}`, kind: "test" });
  }

  return { tracker: { previous: state, seen, testEventId, celebrated }, moments };
}

/**
 * An account added to a screen brings its history at once: live items the screen never showed,
 * and MRR that may cross milestones. None of it just happened.
 */
function showSameAccounts(a: DisplayState, b: DisplayState): boolean {
  const ids = new Set(a.accounts.map((account) => account.id));
  return a.accounts.length === b.accounts.length && b.accounts.every(({ id }) => ids.has(id));
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
    case "milestone":
      return "milestone";
    case "summary":
      if (moment.revenue > 0) return sound.onPayment ? "payment" : null;
      if (moment.mrrChange >= 0) return sound.onMrrUp ? "mrrUp" : null;
      return sound.onMrrDown ? "mrrDown" : null;
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
      return null;
  }
}

/** How long a moment stays on screen; shorter when others are waiting, to never lag behind. */
export function momentDuration(moment: Moment, waiting: number): number {
  const base = moment.kind === "milestone" ? 6500 : moment.kind === "movement" ? 4200 : 5200;
  return waiting > 0 ? Math.max(3200, base * 0.7) : base;
}

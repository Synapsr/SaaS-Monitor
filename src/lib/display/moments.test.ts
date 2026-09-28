import { describe, expect, it } from "vitest";
import {
  initialMomentTracker,
  momentCelebration,
  momentDuration,
  momentSound,
  planMoments,
  trackMoments,
  type Moment,
  type MomentTracker,
} from "@/lib/display/moments";
import { displayState, feedItem, withActivity } from "@/lib/display/testing";
import type { DisplayState } from "@/lib/display/types";
import { defaultScreenSettings } from "@/lib/screens/settings";

function track(states: DisplayState[]): Moment[][] {
  let tracker: MomentTracker = initialMomentTracker;
  return states.map((state) => {
    const result = trackMoments(tracker, state);
    tracker = result.tracker;
    return result.moments;
  });
}

describe("moment planning", () => {
  it("merges a new subscription with its first payment", () => {
    const movement = feedItem({ id: "movement:1", kind: "new", amount: 19_900 });
    const payment = feedItem({ id: "payment:1", kind: "payment", amount: 19_900 });
    expect(planMoments([movement, payment])).toEqual([
      { id: "payment:1", kind: "payment", payment, movement },
    ]);
  });

  it("keeps unrelated payments and movements apart", () => {
    const payment = feedItem({ kind: "payment", country: "DE" });
    const churn = feedItem({ kind: "churn", amount: -7_900 });
    expect(planMoments([payment, churn]).map((moment) => moment.kind)).toEqual([
      "payment",
      "movement",
    ]);
  });

  it("does not merge a payment with a subscription change from long before", () => {
    const movement = feedItem({ kind: "expansion", occurredAt: "2026-09-28T10:00:00Z" });
    const payment = feedItem({ kind: "payment", occurredAt: "2026-09-28T12:00:00Z" });
    expect(planMoments([movement, payment])).toHaveLength(2);
  });

  it("summarizes a burst in a single moment", () => {
    const burst = [
      feedItem({ kind: "payment", amount: 4_900 }),
      feedItem({ kind: "payment", amount: 19_900 }),
      feedItem({ kind: "new", amount: 7_900 }),
      feedItem({ kind: "churn", amount: -2_900 }),
    ];
    expect(planMoments(burst)).toEqual([
      expect.objectContaining({
        kind: "summary",
        payments: 2,
        changes: 2,
        revenue: 24_800,
        mrrChange: 5_000,
      }),
    ]);
  });
});

describe("moment tracking", () => {
  it("starts from a baseline: nothing on the first state", () => {
    const state = displayState({ feed: [feedItem()], testEvent: { id: "t1" } });
    expect(track([state])).toEqual([[]]);
  });

  it("celebrates live activity after the first state", () => {
    const state = displayState();
    const payment = feedItem();
    const [, moments] = track([state, withActivity(state, [payment])]);
    expect(moments).toEqual([expect.objectContaining({ kind: "payment", payment })]);
  });

  it("celebrates a crossed milestone once, after the activity that crossed it", () => {
    const state = displayState({ metrics: { ...displayState().metrics, mrr: 990_000 } });
    const upgrade = feedItem({ kind: "expansion", amount: 20_000 });
    const crossed = withActivity(state, [upgrade], 1_010_000);
    const back = withActivity(crossed, [feedItem({ kind: "churn", amount: -30_000 })], 980_000);
    const again = withActivity(back, [feedItem({ kind: "new", amount: 30_000 })], 1_010_000);

    const moments = track([state, crossed, back, again]);
    expect(moments[1].map((moment) => moment.kind)).toEqual(["movement", "milestone"]);
    expect(moments[1][1]).toMatchObject({ amount: 1_000_000, isGoal: false });
    expect(moments[3].map((moment) => moment.kind)).toEqual(["movement"]);
  });

  it("flags the custom goal", () => {
    const settings = { ...defaultScreenSettings, goal: 15_000 };
    const state = displayState({
      screen: { name: "Office", settings },
      metrics: { ...displayState().metrics, mrr: 1_490_000 },
    });
    const [, moments] = track([state, withActivity(state, [feedItem()], 1_520_000)]);
    expect(moments.at(-1)).toMatchObject({ kind: "milestone", amount: 1_500_000, isGoal: true });
  });

  it("sets a new baseline when the import completes", () => {
    const importing = displayState({ status: "importing" });
    const ready = withActivity(displayState(), [feedItem(), feedItem()], 5_000_000);
    expect(track([importing, ready])).toEqual([[], []]);
  });

  it("plays a test celebration when a new test event arrives", () => {
    const state = displayState({ testEvent: { id: "t1" } });
    const moments = track([
      state,
      { ...state, testEvent: { id: "t1" } },
      { ...state, testEvent: { id: "t2" } },
    ]);
    expect(moments).toEqual([[], [], [{ id: "test:t2", kind: "test" }]]);
  });
});

describe("moment sounds", () => {
  const sound = defaultScreenSettings.sound;
  const payment: Moment = { id: "p", kind: "payment", payment: feedItem(), movement: null };
  const churn: Moment = {
    id: "c",
    kind: "movement",
    movement: feedItem({ kind: "churn", amount: -4_900 }),
  };

  it("maps moments to sounds", () => {
    expect(momentSound(payment, sound)).toBe("payment");
    expect(momentSound(churn, sound)).toBe("mrrDown");
    expect(momentSound({ id: "m", kind: "milestone", amount: 1, isGoal: false }, sound)).toBe(
      "milestone",
    );
  });

  it("respects the master switch and each event's toggle", () => {
    expect(momentSound(payment, { ...sound, enabled: false })).toBeNull();
    expect(momentSound(payment, { ...sound, onPayment: false })).toBeNull();
    expect(momentSound(churn, { ...sound, onMrrDown: false })).toBeNull();
    expect(momentSound({ id: "t", kind: "test" }, { ...sound, onPayment: false })).toBe("payment");
  });

  it("shortens moments while others are waiting", () => {
    expect(momentDuration(payment, 2)).toBeLessThan(momentDuration(payment, 0));
  });
});

describe("moment celebrations", () => {
  it("throws confetti for money coming in and milestones, never for losses", () => {
    const summary = (revenue: number): Moment => ({
      id: "s",
      kind: "summary",
      payments: 1,
      changes: 3,
      revenue,
      mrrChange: -9_000,
    });
    expect(
      momentCelebration({ id: "p", kind: "payment", payment: feedItem(), movement: null }),
    ).toBe("payment");
    expect(momentCelebration({ id: "m", kind: "milestone", amount: 1, isGoal: true })).toBe(
      "milestone",
    );
    expect(momentCelebration({ id: "t", kind: "test" })).toBe("payment");
    expect(momentCelebration(summary(4_900))).toBe("payment");
    expect(momentCelebration(summary(0))).toBeNull();
    const churn = feedItem({ kind: "churn", amount: -4_900 });
    expect(momentCelebration({ id: "c", kind: "movement", movement: churn })).toBeNull();
  });
});

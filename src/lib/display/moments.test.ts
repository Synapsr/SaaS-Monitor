import { describe, expect, it } from "vitest";
import {
  initialMomentTracker,
  momentAccount,
  momentCelebration,
  momentDuration,
  momentSound,
  planMoments,
  trackMoments,
  type Moment,
  type MomentTracker,
} from "@/lib/display/moments";
import type { DisplayState } from "@/lib/display/types";
import { defaultScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { displayState, feedItem, withActivity } from "@/test/display";

function track(states: DisplayState[]): Moment[][] {
  let tracker: MomentTracker = initialMomentTracker;
  return states.map((state) => {
    const result = trackMoments(tracker, state);
    tracker = result.tracker;
    return result.moments;
  });
}

function atMrr(mrr: number): DisplayState {
  return displayState({ metrics: { ...displayState().metrics, mrr } });
}

function withSettings(state: DisplayState, settings: Partial<ScreenSettings>): DisplayState {
  return {
    ...state,
    screen: { ...state.screen, settings: { ...state.screen.settings, ...settings } },
  };
}

describe("moment planning", () => {
  it("announces a new subscription first, then the payment that started it", () => {
    // Stripe collects the first payment a few seconds before the subscription is active.
    const payment = feedItem({
      id: "payment:1",
      kind: "payment",
      amount: 19_900,
      occurredAt: "2026-09-28T12:00:00Z",
    });
    const movement = feedItem({
      id: "movement:1",
      kind: "new",
      amount: 19_900,
      occurredAt: "2026-09-28T12:00:04Z",
    });
    const earlier = feedItem({ id: "payment:0", occurredAt: "2026-09-28T11:59:00Z" });
    expect(planMoments([earlier, payment, movement])).toEqual([
      { id: "payment:0", kind: "payment", payment: earlier },
      { id: "movement:1", kind: "movement", movement },
      { id: "payment:1", kind: "payment", payment },
    ]);
  });

  it("pairs them however differently the charge names the customer", () => {
    // Charges carry the billing name and the card's country; movements, the Stripe customer's.
    const movement = feedItem({ kind: "new", customerName: "Acme Inc", country: "FR" });
    const payment = feedItem({ kind: "payment", customerName: "Ada Lovelace", country: "GB" });
    expect(planMoments([payment, movement]).map((moment) => moment.id)).toEqual([
      movement.id,
      payment.id,
    ]);
  });

  it("keeps apart the payment of another customer, however alike", () => {
    const movement = feedItem({ kind: "new", customerKey: "customer_1" });
    const payment = feedItem({ kind: "payment", customerKey: "customer_2" });
    expect(planMoments([movement, payment])).toHaveLength(2);
  });

  it("keeps unrelated payments and movements apart", () => {
    const payment = feedItem({ kind: "payment", country: "DE" });
    const churn = feedItem({ kind: "churn", amount: -7_900 });
    expect(planMoments([payment, churn]).map((moment) => moment.kind)).toEqual([
      "payment",
      "movement",
    ]);
  });

  it("does not pair a payment with a subscription change from long before", () => {
    const movement = feedItem({ kind: "expansion", occurredAt: "2026-09-28T10:00:00Z" });
    const payment = feedItem({ kind: "payment", occurredAt: "2026-09-28T12:00:00Z" });
    expect(planMoments([payment, movement]).map((moment) => moment.kind)).toEqual([
      "movement",
      "payment",
    ]);
  });

  it("summarizes a burst in a single moment", () => {
    const burst = [
      feedItem({ kind: "payment", amount: 4_900, customerKey: "customer_1" }),
      feedItem({ kind: "payment", amount: 19_900, customerKey: "customer_2" }),
      feedItem({ kind: "new", amount: 7_900, customerKey: "customer_3" }),
      feedItem({ kind: "churn", amount: -2_900, customerKey: "customer_4" }),
    ];
    expect(planMoments(burst)).toEqual([
      expect.objectContaining({
        kind: "summary",
        accountId: "a1",
        events: ["payment", "subscription", "cancellation"],
        payments: 2,
        changes: 2,
        customers: 0,
        revenue: 24_800,
        mrrChange: 5_000,
      }),
    ]);
  });

  it("counts what happened, not items, towards a burst: a checkout and a sign-up are two", () => {
    const checkout = [
      feedItem({ kind: "customer", amount: 0, customerKey: "customer_1" }),
      feedItem({ kind: "payment", customerKey: "customer_1" }),
      feedItem({ kind: "new", customerKey: "customer_1" }),
    ];
    const signUp = feedItem({ kind: "customer", amount: 0, customerKey: "customer_2" });
    expect(planMoments([signUp, ...checkout]).map((moment) => moment.kind)).toEqual([
      "customer",
      "movement",
      "payment",
    ]);
  });

  it("never pairs a payment made for a Stripe Connect account with a subscription", () => {
    const payment = feedItem({
      kind: "payment",
      amount: 19_900,
      connect: { applicationFee: 500 },
      occurredAt: "2026-09-28T12:00:00Z",
    });
    const movement = feedItem({ kind: "new", amount: 19_900, occurredAt: "2026-09-28T12:00:04Z" });
    expect(planMoments([payment, movement]).map((moment) => moment.kind)).toEqual([
      "payment",
      "movement",
    ]);
  });

  it("sums up only the fees of payments made for Stripe Connect accounts", () => {
    const burst = [
      feedItem({ kind: "payment", amount: 4_900, customerKey: "c1" }),
      feedItem({
        kind: "payment",
        amount: 10_000,
        customerKey: "c2",
        connect: { applicationFee: 300 },
      }),
      feedItem({
        kind: "payment",
        amount: 8_000,
        customerKey: "c3",
        connect: { applicationFee: null },
      }),
      feedItem({ kind: "payment", amount: 2_900, customerKey: "c4" }),
    ];
    expect(planMoments(burst)).toEqual([
      expect.objectContaining({ kind: "summary", payments: 4, revenue: 4_900 + 300 + 2_900 }),
    ]);
  });

  it("announces a new customer who has not paid yet", () => {
    const customer = feedItem({ id: "customer:1", kind: "customer", amount: 0, planName: null });
    expect(planMoments([customer])).toEqual([{ id: "customer:1", kind: "customer", customer }]);
  });

  it("announces a customer created at checkout with what they bought", () => {
    // Stripe Checkout creates the customer, the subscription and the payment at once.
    const customer = feedItem({ kind: "customer", amount: 0 });
    const movement = feedItem({ kind: "new", amount: 19_900 });
    const payment = feedItem({ kind: "payment", amount: 19_900 });
    expect(planMoments([customer, payment, movement])).toEqual([
      { id: movement.id, kind: "movement", movement },
      { id: payment.id, kind: "payment", payment },
    ]);
  });

  it("keeps apart new customers and what others paid", () => {
    const customer = feedItem({ kind: "customer", amount: 0, customerKey: "customer_2" });
    const payment = feedItem({ kind: "payment", customerKey: "customer_1" });
    expect(planMoments([customer, payment]).map((moment) => moment.kind)).toEqual([
      "customer",
      "payment",
    ]);
  });

  it("plans each account on its own, and plays everything in the order it happened", () => {
    const at = (minute: number) => `2026-09-28T12:0${minute}:00.000Z`;
    const acme = (minute: number) => feedItem({ accountId: "a1", occurredAt: at(minute) });
    const beta = (minute: number) =>
      feedItem({ accountId: "b1", accountName: "Beta", occurredAt: at(minute) });
    // Acme has a burst while Beta makes two sales around it.
    const fresh = [acme(1), beta(2), acme(3), acme(4), acme(5), beta(6)];

    const moments = planMoments(fresh);

    expect(moments.map((moment) => [moment.kind, momentAccount(moment)])).toEqual([
      ["payment", "b1"],
      ["summary", "a1"],
      ["payment", "b1"],
    ]);
    expect(moments[1]).toMatchObject({ payments: 4 });
  });

  it("tells which account each moment comes from", () => {
    const payment = feedItem({ accountId: "b1" });
    expect(momentAccount({ id: "p", kind: "payment", payment })).toBe("b1");
    expect(momentAccount({ id: "t", kind: "test" })).toBeNull();
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

  it("waits one poll for the subscription a first payment starts, to announce it first", () => {
    const state = displayState();
    const payment = feedItem({ customerSubscribed: false, occurredAt: "2026-09-28T12:00:00Z" });
    const movement = feedItem({ kind: "new", occurredAt: "2026-09-28T12:00:04Z" });
    const paid = withActivity(state, [payment]);
    const subscribed = withActivity(paid, [movement]);

    expect(track([state, paid, subscribed])).toEqual([
      [],
      [],
      [
        { id: movement.id, kind: "movement", movement },
        { id: payment.id, kind: "payment", payment },
      ],
    ]);
  });

  it("plays a first payment alone when no subscription followed it", () => {
    const state = displayState();
    const payment = feedItem({ customerSubscribed: false });
    const paid = withActivity(state, [payment]);
    const later = withActivity(paid, []);
    expect(track([state, paid, later])).toEqual([[], [], [expect.objectContaining({ payment })]]);
  });

  it("plays at once a payment of a subscriber, or one that came with its subscription", () => {
    const state = displayState();
    const renewal = feedItem({ customerSubscribed: true, customerKey: "customer_1" });
    const checkout = [
      feedItem({ customerSubscribed: false, customerKey: "customer_2" }),
      feedItem({ kind: "new", customerKey: "customer_2" }),
    ];
    const [, moments] = track([state, withActivity(state, [renewal, ...checkout])]);
    expect(moments.map((moment) => moment.kind)).toEqual(["payment", "movement", "payment"]);
  });

  it("lets events that neither show nor play go by", () => {
    const { events } = defaultScreenSettings;
    const state = withSettings(displayState(), {
      events: {
        ...events,
        connectPayment: { feed: true, moment: false, sound: false, voice: false },
        customer: { feed: false, moment: false, sound: true, voice: false },
      },
    });
    const connect = feedItem({ connect: { applicationFee: null } });
    const signUp = feedItem({ kind: "customer", amount: 0, customerKey: "customer_2" });
    const [, moments] = track([state, withActivity(state, [connect, signUp])]);
    // Kept off screen but heard: its sound plays without a card.
    expect(moments).toEqual([expect.objectContaining({ kind: "customer", customer: signUp })]);
  });

  it("celebrates a crossed milestone once, after the activity that crossed it", () => {
    const state = displayState({ metrics: { ...displayState().metrics, mrr: 990_000 } });
    const upgrade = feedItem({ kind: "expansion", amount: 20_000 });
    const crossed = withActivity(state, [upgrade], 1_010_000);
    const back = withActivity(crossed, [feedItem({ kind: "churn", amount: -30_000 })], 980_000);
    const again = withActivity(back, [feedItem({ kind: "new", amount: 30_000 })], 1_010_000);

    const moments = track([state, crossed, back, again]);
    expect(moments[1].map((moment) => moment.kind)).toEqual(["movement", "milestone"]);
    expect(moments[1][1]).toMatchObject({ amount: 1_000_000, metric: "mrr", isGoal: false });
    expect(moments[3].map((moment) => moment.kind)).toEqual(["movement"]);
  });

  it("flags the custom goal", () => {
    const state = withSettings(atMrr(1_490_000), { goal: 15_000 });
    const [, moments] = track([state, withActivity(state, [feedItem()], 1_520_000)]);
    expect(moments.at(-1)).toMatchObject({ kind: "milestone", amount: 1_500_000, isGoal: true });
  });

  it("celebrates round ARR numbers on a screen showing ARR", () => {
    // $20,800 of MRR is $249,600 of ARR.
    const state = withSettings(atMrr(2_080_000), { metric: "arr" });
    const [, moments] = track([state, withActivity(state, [feedItem()], 2_085_000)]);
    expect(moments.at(-1)).toEqual({
      id: "milestone:arr:25000000",
      kind: "milestone",
      amount: 25_000_000,
      metric: "arr",
      isGoal: false,
      accountId: null,
    });
  });

  it("sets a new baseline for milestones when the metric changes, but keeps the activity", () => {
    const inMrr = atMrr(2_080_000);
    const sale = feedItem();
    // Switched to ARR as a sale lifts it from $249,600 to $250,200: the screen showed $20,800 of
    // MRR a moment ago, nothing was crossed.
    const inArr = withSettings(withActivity(inMrr, [sale], 2_085_000), { metric: "arr" });
    const upgrade = feedItem({ kind: "expansion", amount: 2_085_000 });

    const moments = track([
      inMrr,
      inArr,
      withSettings(inArr, { metric: "mrr" }),
      inArr,
      withActivity(inArr, [upgrade], 4_170_000),
    ]);

    expect(moments.map((played) => played.map((moment) => moment.kind))).toEqual([
      [],
      ["payment"],
      [],
      [],
      ["movement", "milestone"],
    ]);
    expect(moments[4][1]).toMatchObject({ amount: 50_000_000, metric: "arr" });
  });

  it("sets a new baseline for milestones when the goal changes", () => {
    const state = atMrr(1_490_000);
    // The goal is set to $15K as a sale lifts MRR past it: MRR did not reach the goal, the
    // founder moved it. Then it is raised to $16K, which MRR reaches.
    const set = withSettings(withActivity(state, [feedItem()], 1_520_000), { goal: 15_000 });
    const raised = withSettings(set, { goal: 16_000 });
    const reached = withActivity(raised, [feedItem({ kind: "new", amount: 90_000 })], 1_610_000);

    const moments = track([state, set, raised, reached]);

    expect(moments.map((played) => played.map((moment) => moment.kind))).toEqual([
      [],
      ["payment"],
      [],
      ["movement", "milestone"],
    ]);
    expect(moments[3][1]).toMatchObject({ amount: 1_600_000, isGoal: true });
  });

  it("sets a new baseline when the import completes", () => {
    const importing = displayState({ status: "importing" });
    const ready = withActivity(displayState(), [feedItem(), feedItem()], 5_000_000);
    expect(track([importing, ready])).toEqual([[], []]);
  });

  it("sets a new baseline when the screen's accounts change", () => {
    const acme = displayState().accounts[0];
    const beta = { ...acme, id: "b1", name: "Beta" };
    const alone = displayState({ metrics: { ...displayState().metrics, mrr: 300_000 } });
    // Beta brings its history: a payment detected live last week, and $9k of MRR.
    const history = [feedItem({ accountName: "Beta", occurredAt: "2026-09-21T10:00:00Z" })];
    const together = { ...withActivity(alone, history, 1_200_000), accounts: [acme, beta] };
    const sale = feedItem({ accountName: "Beta" });

    // Beta is added, removed and added again, then makes a sale.
    const moments = track([alone, together, alone, together, withActivity(together, [sale])]);

    expect(moments).toEqual([
      [],
      [],
      [],
      [],
      [expect.objectContaining({ kind: "payment", payment: sale })],
    ]);
  });

  it("celebrates the milestones of each account on a screen rotating between them", () => {
    const view = (accountId: string, mrr: number) => ({
      accountId,
      metrics: { ...displayState().metrics, mrr },
      series: displayState().series,
    });
    const acme = displayState().accounts[0];
    const beta = { ...acme, id: "b1", name: "Beta" };
    const before = withSettings(
      displayState({ accounts: [acme, beta], views: [view("a1", 95_000), view("b1", 480_000)] }),
      { rotation: { enabled: true, seconds: 15, includeTotal: true } },
    );
    // Beta crosses $5K of MRR; the total ($10K) and Acme cross nothing.
    const after = { ...before, views: [view("a1", 95_000), view("b1", 510_000)] };

    const [, moments] = track([before, after]);
    expect(moments).toEqual([
      {
        id: "milestone:mrr:b1:500000",
        kind: "milestone",
        amount: 500_000,
        metric: "mrr",
        isGoal: false,
        accountId: "b1",
      },
    ]);

    // Combined, the accounts are not shown on their own: neither are their milestones.
    const combined = withSettings(before, {
      rotation: { ...before.screen.settings.rotation, enabled: false },
    });
    expect(track([combined, { ...combined, views: after.views }])).toEqual([[], []]);
  });

  it("leaves the total's milestones out when a rotation never shows the total", () => {
    const acme = displayState().accounts[0];
    const state = withSettings(
      displayState({ accounts: [acme, { ...acme, id: "b1" }], views: [] }),
      { rotation: { enabled: true, seconds: 15, includeTotal: false } },
    );
    const views = (mrr: number) =>
      ["a1", "b1"].map((accountId) => ({
        accountId,
        metrics: { ...state.metrics, mrr },
        series: state.series,
      }));
    const before = { ...state, views: views(400_000), metrics: { ...state.metrics, mrr: 990_000 } };
    const after = { ...before, metrics: { ...state.metrics, mrr: 1_010_000 } };
    expect(track([before, after])).toEqual([[], []]);
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
  const settings = defaultScreenSettings;
  const payment: Moment = { id: "p", kind: "payment", payment: feedItem() };
  const churn: Moment = {
    id: "c",
    kind: "movement",
    movement: feedItem({ kind: "churn", amount: -4_900 }),
  };

  const customer: Moment = { id: "n", kind: "customer", customer: feedItem({ kind: "customer" }) };
  const summary = (fields: { revenue: number; mrrChange: number; customers: number }): Moment => ({
    id: "s",
    kind: "summary",
    accountId: "a1",
    events: ["payment", "customer"],
    payments: 0,
    changes: 0,
    ...fields,
  });

  it("maps moments to sounds", () => {
    expect(momentSound(payment, settings)).toBe("payment");
    expect(momentSound(churn, settings)).toBe("mrrDown");
    expect(momentSound(customer, settings)).toBe("customer");
    expect(
      momentSound(
        { id: "m", kind: "milestone", amount: 1, metric: "mrr", isGoal: false, accountId: null },
        settings,
      ),
    ).toBe("milestone");
  });

  it("sounds a summary like the best news it brings", () => {
    expect(momentSound(summary({ revenue: 4_900, mrrChange: -900, customers: 2 }), settings)).toBe(
      "payment",
    );
    expect(momentSound(summary({ revenue: 0, mrrChange: 900, customers: 2 }), settings)).toBe(
      "mrrUp",
    );
    expect(momentSound(summary({ revenue: 0, mrrChange: 0, customers: 2 }), settings)).toBe(
      "customer",
    );
    expect(momentSound(summary({ revenue: 0, mrrChange: -900, customers: 2 }), settings)).toBe(
      "mrrDown",
    );
  });

  it("follows the sound switch and each event's own", () => {
    const quiet = (event: "payment" | "cancellation" | "customer") => ({
      ...settings,
      events: { ...settings.events, [event]: { ...settings.events[event], sound: false } },
    });
    expect(
      momentSound(payment, { ...settings, sound: { ...settings.sound, enabled: false } }),
    ).toBeNull();
    expect(momentSound(payment, quiet("payment"))).toBeNull();
    expect(momentSound(churn, quiet("cancellation"))).toBeNull();
    expect(momentSound(customer, quiet("customer"))).toBeNull();
    // A test celebration was asked for: only the sound switch applies.
    expect(momentSound({ id: "t", kind: "test" }, quiet("payment"))).toBe("payment");
  });

  it("sounds a summary when one of the events it sums up does", () => {
    const burst = summary({ revenue: 4_900, mrrChange: 0, customers: 1 });
    const silent = { ...settings.events.payment, sound: false };
    expect(
      momentSound(burst, { ...settings, events: { ...settings.events, payment: silent } }),
    ).toBe("payment");
    expect(
      momentSound(burst, {
        ...settings,
        events: { ...settings.events, payment: silent, customer: silent },
      }),
    ).toBeNull();
  });

  it("shortens moments while others are waiting", () => {
    expect(momentDuration(payment, 2, { seconds: 10, seen: true })).toBeLessThan(
      momentDuration(payment, 0, { seconds: 10, seen: true }),
    );
    expect(momentDuration(payment, 5, { seconds: 3, seen: true })).toBe(3_200);
  });

  it("stays on screen as long as the screen's setting says, milestones a little longer", () => {
    expect(momentDuration(payment, 0, { seconds: 10, seen: true })).toBe(10_000);
    expect(momentDuration(payment, 0, { seconds: 30, seen: true })).toBe(30_000);
    const milestone: Moment = {
      id: "m",
      kind: "milestone",
      amount: 1,
      metric: "mrr",
      isGoal: false,
      accountId: null,
    };
    expect(momentDuration(milestone, 0, { seconds: 3, seen: true })).toBe(6_500);
    expect(momentDuration(milestone, 0, { seconds: 15, seen: true })).toBe(15_000);
  });

  it("only takes the time of its sound and voice without a card", () => {
    expect(momentDuration(payment, 0, { seconds: 30, seen: false })).toBe(2_500);
  });
});

describe("moment celebrations", () => {
  it("throws confetti for money coming in and milestones, never for losses", () => {
    const summary = (revenue: number): Moment => ({
      id: "s",
      kind: "summary",
      accountId: "a1",
      events: ["payment", "cancellation"],
      payments: 1,
      changes: 3,
      customers: 0,
      revenue,
      mrrChange: -9_000,
    });
    expect(momentCelebration({ id: "p", kind: "payment", payment: feedItem() })).toBe("payment");
    expect(
      momentCelebration({
        id: "m",
        kind: "milestone",
        amount: 1,
        metric: "mrr",
        isGoal: true,
        accountId: null,
      }),
    ).toBe("milestone");
    expect(momentCelebration({ id: "t", kind: "test" })).toBe("payment");
    expect(momentCelebration(summary(4_900))).toBe("payment");
    expect(momentCelebration(summary(0))).toBeNull();
    const churn = feedItem({ kind: "churn", amount: -4_900 });
    expect(momentCelebration({ id: "c", kind: "movement", movement: churn })).toBeNull();
    const customer = feedItem({ kind: "customer" });
    expect(momentCelebration({ id: "n", kind: "customer", customer })).toBeNull();
    // Money for a Stripe Connect account passes through: it rings, without confetti.
    const connect = feedItem({ connect: { applicationFee: 300 } });
    expect(momentCelebration({ id: "c", kind: "payment", payment: connect })).toBeNull();
  });
});

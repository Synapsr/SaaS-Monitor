import type { DisplayState, FeedItem } from "@/lib/display/types";
import { defaultScreenSettings } from "@/lib/screens/settings";

/** Test fixtures: a ready screen at $10k MRR, and feed items. */

let sequence = 0;

export function feedItem(overrides: Partial<FeedItem> = {}): FeedItem {
  sequence += 1;
  return {
    id: `payment:${sequence}`,
    kind: "payment",
    amount: 4_900,
    original: null,
    occurredAt: "2026-09-28T12:00:00.000Z",
    live: true,
    customerKey: "customer_1",
    customerName: null,
    country: "FR",
    planName: "Pro",
    connect: null,
    accountId: "a1",
    accountName: "Acme",
    ...overrides,
  };
}

export function displayState(overrides: Partial<DisplayState> = {}): DisplayState {
  return {
    version: "test",
    generatedAt: "2026-09-28T12:00:00.000Z",
    screen: { name: "Office", settings: defaultScreenSettings },
    currency: "usd",
    status: "ready",
    accounts: [{ id: "a1", name: "Acme", status: "ready", livemode: true }],
    metrics: {
      mrr: 1_000_000,
      mrr30DaysAgo: 900_000,
      arr: 12_000_000,
      activeCustomers: 95,
      trialingSubscriptions: 4,
      arpu: 10_526,
      customersCreatedToday: 3,
      revenue: {
        today: 50_000,
        yesterday: 40_000,
        monthToDate: 800_000,
        previousMonthToDate: 700_000,
      },
      thisMonth: {
        new: 120_000,
        expansion: 20_000,
        reactivation: 0,
        contraction: -5_000,
        churn: -35_000,
        net: 100_000,
        newCustomers: 12,
      },
    },
    series: {
      mrr: [
        { date: "2026-09-27", value: 990_000 },
        { date: "2026-09-28", value: 1_000_000 },
      ],
    },
    views: [],
    feed: [],
    testEvent: null,
    personalizedVoice: false,
    warnings: [],
    ...overrides,
  };
}

/** `state` after some new activity: fresh items on top of the feed and a new MRR. */
export function withActivity(state: DisplayState, items: FeedItem[], mrr?: number): DisplayState {
  return {
    ...state,
    feed: [...items, ...state.feed],
    metrics: { ...state.metrics, mrr: mrr ?? state.metrics.mrr },
  };
}

import { describe, expect, it } from "vitest";
import { screenSnapshot, snapshotEvent, snapshotEventText } from "@/lib/display/snapshot";
import type { DisplayState } from "@/lib/display/types";
import { screenSettingsSchema, type ScreenSettingsInput } from "@/lib/screens/settings";
import { displayState, feedItem } from "@/test/display";

const GENERATED_AT = "2026-09-28T12:00:00.000Z";

function stateWith(
  settings: ScreenSettingsInput,
  overrides: Partial<DisplayState> = {},
): DisplayState {
  return displayState({
    generatedAt: GENERATED_AT,
    screen: { name: "Office", settings: screenSettingsSchema.parse(settings) },
    ...overrides,
  });
}

const minutesAgo = (minutes: number) =>
  new Date(new Date(GENERATED_AT).getTime() - minutes * 60_000).toISOString();

describe("screen snapshots", () => {
  it("show what a ready wall shows: its number, growth, curve and latest event", () => {
    const state = stateWith(
      {},
      {
        feed: [
          feedItem({ kind: "payment", amount: 7_900, occurredAt: minutesAgo(3) }),
          feedItem({ kind: "new", amount: 4_900, occurredAt: minutesAgo(40) }),
        ],
      },
    );
    const snapshot = screenSnapshot(state);
    expect(snapshot).toMatchObject({
      kind: "live",
      title: "Monthly recurring revenue",
      value: "$10,000",
      growth: { label: "+11%", period: "in 30 days", trend: "up" },
      series: [990_000, 1_000_000],
      latest: { amount: "$79", kind: "Payment", time: "3 min ago", goodNews: true },
    });
  });

  it("present recurring amounts in ARR on a screen showing it", () => {
    const state = stateWith(
      { metric: "arr" },
      { feed: [feedItem({ kind: "new", amount: 4_900, occurredAt: minutesAgo(5) })] },
    );
    expect(screenSnapshot(state)).toMatchObject({
      kind: "live",
      title: "Annual recurring revenue",
      value: "$120,000",
      series: [11_880_000, 12_000_000],
      latest: { amount: "+$588", kind: "New subscription" },
    });
  });

  it("speak the screen's language, with its numbers", () => {
    const state = stateWith(
      { language: "fr", currency: "eur" },
      {
        currency: "eur",
        feed: [feedItem({ kind: "payment", amount: 15_920, occurredAt: minutesAgo(90) })],
      },
    );
    const snapshot = screenSnapshot(state);
    expect(snapshot).toMatchObject({
      kind: "live",
      title: "Revenu mensuel récurrent",
      growth: { period: "en 30 jours" },
    });
    if (snapshot.kind !== "live") throw new Error("Expected a live snapshot");
    expect(snapshot.value).toMatch(/^10\s000\s€$/);
    expect(snapshot.latest?.kind).toBe("Paiement");
    expect(snapshot.growth?.label).toMatch(/^\+11\s%$/);
  });

  it("only show events the screen's feed lists", () => {
    const state = stateWith(
      { events: { payment: { feed: false } } },
      {
        feed: [
          feedItem({ kind: "payment", occurredAt: minutesAgo(1) }),
          feedItem({ kind: "churn", amount: -2_900, occurredAt: minutesAgo(30) }),
        ],
      },
    );
    expect(screenSnapshot(state)).toMatchObject({
      latest: { amount: "-$29", kind: "Cancellation", goodNews: false },
    });
  });

  it("give the change in money when there is nothing to compare with", () => {
    const state = stateWith({}, {});
    state.metrics = { ...state.metrics, mrr: 50_000, mrr30DaysAgo: 0 };
    expect(screenSnapshot(state)).toMatchObject({
      growth: { label: "+$500", trend: "up" },
    });

    state.metrics = { ...state.metrics, mrr: 50_000, mrr30DaysAgo: 50_000 };
    expect(screenSnapshot(state)).toMatchObject({ growth: { label: "0%", trend: "flat" } });
  });

  it("are quiet while there is no revenue and no activity yet", () => {
    const state = stateWith({});
    state.metrics = { ...state.metrics, mrr: 0, mrr30DaysAgo: 0 };
    expect(screenSnapshot(state)).toEqual({
      kind: "quiet",
      title: "Monthly recurring revenue",
      value: "$0",
      caption: expect.stringContaining("will appear here"),
    });
  });

  it("show the wall's status until it has numbers", () => {
    expect(screenSnapshot(stateWith({}, { status: "empty", accounts: [] }))).toEqual({
      kind: "empty",
    });
    expect(screenSnapshot(stateWith({}, { status: "importing" }))).toEqual({
      kind: "importing",
    });
    expect(screenSnapshot(stateWith({}, { status: "error" }))).toEqual({ kind: "error" });
  });
});

describe("snapshot events", () => {
  it("read as one line", () => {
    const state = stateWith({});
    const payment = snapshotEvent(
      feedItem({ kind: "payment", amount: 7_900, occurredAt: minutesAgo(3) }),
      state,
    );
    expect(snapshotEventText(payment)).toBe("$79 · Payment · 3 min ago");

    const customer = snapshotEvent(
      feedItem({ kind: "customer", amount: 0, occurredAt: minutesAgo(0) }),
      state,
    );
    expect(snapshotEventText(customer)).toBe("New customer · just now");
  });
});

import { describe, expect, it } from "vitest";
import { nextSlide, rotationSlides, screenView, TOTAL } from "@/lib/display/rotation";
import type { DisplayState } from "@/lib/display/types";
import { displayState, feedItem } from "@/test/display";

const acme = displayState().accounts[0];
const beta = { ...acme, id: "b1", name: "Beta" };

function twoAccounts(rotation: Partial<DisplayState["screen"]["settings"]["rotation"]> = {}) {
  const state = displayState({ accounts: [acme, beta] });
  const view = (accountId: string, mrr: number) => ({
    accountId,
    metrics: { ...state.metrics, mrr },
    series: { mrr: [{ date: "2026-09-28", value: mrr }] },
  });
  const settings = state.screen.settings;
  return {
    ...state,
    screen: {
      ...state.screen,
      settings: {
        ...settings,
        goal: 15_000,
        rotation: { ...settings.rotation, enabled: true, ...rotation },
      },
    },
    views: [view("a1", 600_000), view("b1", 400_000)],
    feed: [feedItem({ accountId: "b1", accountName: "Beta" }), feedItem({ accountId: "a1" })],
  };
}

describe("rotation slides", () => {
  it("go through the total, then each account", () => {
    expect(rotationSlides(twoAccounts())).toEqual([TOTAL, "a1", "b1"]);
    expect(rotationSlides(twoAccounts({ includeTotal: false }))).toEqual(["a1", "b1"]);
  });

  it("stay on the total when the screen does not rotate, or has nothing to rotate", () => {
    expect(rotationSlides(twoAccounts({ enabled: false }))).toEqual([TOTAL]);
    expect(rotationSlides({ ...twoAccounts(), views: [] })).toEqual([TOTAL]);
    expect(rotationSlides({ ...twoAccounts(), status: "importing" })).toEqual([TOTAL]);
  });

  it("loop back to the first", () => {
    expect(nextSlide([TOTAL, "a1", "b1"], TOTAL)).toBe("a1");
    expect(nextSlide([TOTAL, "a1", "b1"], "b1")).toBe(TOTAL);
    expect(nextSlide([TOTAL, "a1"], "gone")).toBe(TOTAL);
  });
});

describe("screen views", () => {
  it("show an account's own numbers and activity, chasing its milestones", () => {
    const state = twoAccounts();
    const view = screenView(state, "b1");
    expect(view.account).toBe(beta);
    expect(view.metrics.mrr).toBe(400_000);
    expect(view.series.mrr).toEqual([{ date: "2026-09-28", value: 400_000 }]);
    expect(view.feed.map((item) => item.accountId)).toEqual(["b1"]);
    expect(view.goal).toBeNull();
  });

  it("show the total with the screen's goal, and for a slide that is gone", () => {
    const state = twoAccounts();
    for (const slide of [TOTAL, "gone"]) {
      const view = screenView(state, slide);
      expect(view.account).toBeNull();
      expect(view.metrics).toBe(state.metrics);
      expect(view.feed).toEqual(state.feed);
      expect(view.goal).toBe(15_000);
    }
  });

  it("list only the events the screen shows in its feed", () => {
    const state = twoAccounts();
    const { settings } = state.screen;
    const hidden = {
      ...state,
      screen: {
        ...state.screen,
        settings: {
          ...settings,
          events: { ...settings.events, payment: { ...settings.events.payment, feed: false } },
        },
      },
    };
    expect(screenView(hidden, TOTAL).feed).toEqual([]);
  });
});

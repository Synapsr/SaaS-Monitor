import { describe, expect, it } from "vitest";
import { isDisplayState, resolveDisplayState, seriesInRange } from "@/lib/display/state";
import { displayState, feedItem } from "@/lib/display/testing";
import { defaultScreenSettings } from "@/lib/screens/settings";

describe("polled state validation", () => {
  it("accepts a display state", () => {
    expect(isDisplayState(JSON.parse(JSON.stringify(displayState())))).toBe(true);
  });

  it("rejects anything else a network can answer", () => {
    expect(isDisplayState(null)).toBe(false);
    expect(isDisplayState("<html>Sign in to the Wi-Fi</html>")).toBe(false);
    expect(isDisplayState({ error: "Not found" })).toBe(false);
    expect(isDisplayState({ ...displayState(), feed: undefined })).toBe(false);
  });
});

describe("chart range", () => {
  const series = Array.from({ length: 120 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 5, 1 + index)).toISOString().slice(0, 10),
    value: index,
  }));

  it("keeps the points of the range, from the same day a month ago", () => {
    const month = seriesInRange(series, "30d");
    expect(month).toHaveLength(31);
    expect(month.at(-1)).toEqual(series.at(-1));
    expect(seriesInRange(series, "12m")).toHaveLength(120);
  });
});

describe("resolved state", () => {
  it("applies the editor's unsaved changes, except the currency", () => {
    const state = displayState();
    const settings = { ...defaultScreenSettings, accent: "rose" as const, currency: "eur" };
    const resolved = resolveDisplayState(state, { name: "Lobby", settings });
    expect(resolved.screen.name).toBe("Lobby");
    expect(resolved.screen.settings.accent).toBe("rose");
    expect(resolved.screen.settings.currency).toBe("usd");
  });

  it("hides customer names unless the screen shows them", () => {
    const state = displayState({ feed: [feedItem({ customerName: "Ada" })] });
    expect(resolveDisplayState(state, null).feed[0].customerName).toBeNull();

    const settings = { ...defaultScreenSettings, showCustomerNames: true };
    const visible = resolveDisplayState({ ...state, screen: { name: "Office", settings } }, null);
    expect(visible.feed[0].customerName).toBe("Ada");
  });
});

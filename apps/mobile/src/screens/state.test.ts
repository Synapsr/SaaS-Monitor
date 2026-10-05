import { readDisplayState } from "@/screens/state";
import { displayState, feedItem } from "@/test/display";

describe("readDisplayState", () => {
  it("keeps a current state as it is", () => {
    const state = displayState({ feed: [feedItem()] });
    expect(readDisplayState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("fills what an older instance doesn't send", () => {
    const { views, warnings, testEvent, personalizedVoice, ...older } = displayState();
    const { connect, churn, customerEmail, customerSubscribed, ...item } = feedItem();
    const state = readDisplayState({
      ...older,
      screen: { name: "Office", settings: { currency: "usd", accent: "violet" } },
      feed: [item],
    });

    expect(state?.views).toEqual([]);
    expect(state?.warnings).toEqual([]);
    expect(state?.testEvent).toBeNull();
    expect(state?.screen.settings.accent).toBe("violet");
    expect(state?.screen.settings.events.payment).toEqual({
      feed: true,
      moment: true,
      sound: true,
      voice: true,
      push: true,
    });
    expect(state?.feed[0]).toMatchObject({ connect: null, churn: null, customerEmail: null });
  });

  it("takes the currency of the state, which amounts are in", () => {
    const state = displayState({ currency: "eur" });
    expect(readDisplayState(state)?.screen.settings.currency).toBe("eur");
  });

  it("refuses what isn't a display state", () => {
    expect(readDisplayState(null)).toBeNull();
    expect(readDisplayState("<html>Sign in to the Wi-Fi</html>")).toBeNull();
    expect(readDisplayState({ error: "This screen does not exist." })).toBeNull();
  });
});

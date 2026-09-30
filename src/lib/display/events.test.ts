import { describe, expect, it } from "vitest";
import type { Moment } from "@/lib/display/moments";
import { defaultScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { feedItem } from "@/test/display";
import { eventPlays, itemEvent, momentEvents, momentPlays } from "./events";

const payment = (overrides: Parameters<typeof feedItem>[0] = {}): Moment => ({
  id: "payment:1",
  kind: "payment",
  payment: feedItem({ kind: "payment", ...overrides }),
  movement: null,
});

/** Default settings with sound and voice on, and some channels of an event changed. */
function screen(
  changes: Partial<Record<keyof ScreenSettings["events"], Partial<Record<string, boolean>>>> = {},
): ScreenSettings {
  const events = { ...defaultScreenSettings.events };
  for (const [event, channels] of Object.entries(changes) as [keyof typeof events, object][]) {
    events[event] = { ...events[event], ...channels };
  }
  return {
    ...defaultScreenSettings,
    events,
    voice: { ...defaultScreenSettings.voice, enabled: true },
  };
}

describe("screen events", () => {
  it("name what a feed item is", () => {
    expect(itemEvent(feedItem({ kind: "payment" }))).toBe("payment");
    expect(itemEvent(feedItem({ kind: "payment", connect: { applicationFee: 490 } }))).toBe(
      "connectPayment",
    );
    expect(itemEvent(feedItem({ kind: "new" }))).toBe("subscription");
    expect(itemEvent(feedItem({ kind: "expansion" }))).toBe("upgrade");
    expect(itemEvent(feedItem({ kind: "reactivation" }))).toBe("reactivation");
    expect(itemEvent(feedItem({ kind: "contraction" }))).toBe("downgrade");
    expect(itemEvent(feedItem({ kind: "churn" }))).toBe("cancellation");
    // A failed payment is no customer leaving.
    expect(itemEvent(feedItem({ kind: "churn", churn: { reason: "unpaid", endsAt: null } }))).toBe(
      "unpaid",
    );
    expect(itemEvent(feedItem({ kind: "customer" }))).toBe("customer");
  });

  it("name what a moment plays: what a payment started, and what a burst sums up", () => {
    expect(momentEvents(payment())).toEqual(["payment"]);
    expect(momentEvents({ ...payment(), movement: feedItem({ kind: "new" }) } as Moment)).toEqual([
      "subscription",
    ]);
    expect(momentEvents({ id: "t", kind: "test" })).toEqual(["payment"]);
    expect(
      momentEvents({
        id: "s",
        kind: "summary",
        accountId: "a1",
        events: ["connectPayment", "customer"],
        payments: 3,
        changes: 0,
        customers: 1,
        revenue: 100,
        mrrChange: 0,
      }),
    ).toEqual(["connectPayment", "customer"]);
  });
});

describe("channels", () => {
  it("show and play each event on its own", () => {
    const quietConnect = screen({ connectPayment: { feed: false, moment: false, sound: true } });
    const connect = payment({ connect: { applicationFee: 490 } });
    expect(momentPlays(connect, quietConnect, "moment")).toBe(false);
    expect(momentPlays(connect, quietConnect, "sound")).toBe(true);
    expect(momentPlays(payment(), quietConnect, "moment")).toBe(true);
  });

  it("need the sound and the voice turned on", () => {
    const settings = screen();
    expect(momentPlays(payment(), settings, "voice")).toBe(true);
    const mute = { ...settings, voice: { ...settings.voice, enabled: false } };
    expect(momentPlays(payment(), mute, "voice")).toBe(false);
    const silent = { ...settings, sound: { ...settings.sound, enabled: false } };
    expect(momentPlays(payment(), silent, "sound")).toBe(false);
  });

  it("let an event that neither shows nor plays go by as a moment", () => {
    const settings = screen({ connectPayment: { moment: false, sound: false, voice: false } });
    expect(eventPlays("connectPayment", settings)).toBe(false);
    expect(eventPlays("payment", settings)).toBe(true);
    const onlyVoice = screen({ customer: { moment: false, sound: false, voice: true } });
    expect(eventPlays("customer", onlyVoice)).toBe(true);
    expect(
      eventPlays("customer", { ...onlyVoice, voice: { ...onlyVoice.voice, enabled: false } }),
    ).toBe(false);
  });
});

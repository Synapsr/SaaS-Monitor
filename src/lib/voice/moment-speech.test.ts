import { describe, expect, it } from "vitest";
import type { Moment } from "@/lib/display/moments";
import type { DisplayState } from "@/lib/display/types";
import { defaultScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { displayState, feedItem } from "@/test/display";
import {
  momentAnnouncement,
  momentSpeech,
  momentText,
  previewValues,
  recordedClipUrl,
  spokenMoney,
} from "./moment-speech";

function screen(
  voice: Partial<ScreenSettings["voice"]> = {},
  settings: Partial<ScreenSettings> = {},
  state: Partial<DisplayState> = {},
): DisplayState {
  const base = displayState(state);
  return {
    ...base,
    screen: {
      ...base.screen,
      settings: {
        ...defaultScreenSettings,
        ...settings,
        voice: { ...defaultScreenSettings.voice, enabled: true, ...voice },
      },
    },
  };
}

const payment = (overrides: Parameters<typeof feedItem>[0] = {}): Moment => ({
  id: "payment:1",
  kind: "payment",
  payment: feedItem({ kind: "payment", ...overrides }),
  movement: null,
});

describe("momentAnnouncement", () => {
  it("names what a moment announces", () => {
    expect(momentAnnouncement(payment())).toBe("payment");
    expect(momentAnnouncement(payment({ connect: { applicationFee: 490 } }))).toBe(
      "connectPayment",
    );
    expect(
      momentAnnouncement({ ...payment(), movement: feedItem({ kind: "new" }) } as Moment),
    ).toBe("subscription");
    const movement = (kind: "expansion" | "reactivation" | "contraction" | "churn"): Moment => ({
      id: "m",
      kind: "movement",
      movement: feedItem({ kind }),
    });
    expect(momentAnnouncement(movement("expansion"))).toBe("upgrade");
    expect(momentAnnouncement(movement("reactivation"))).toBe("reactivation");
    expect(momentAnnouncement(movement("contraction"))).toBe("downgrade");
    expect(momentAnnouncement(movement("churn"))).toBe("cancellation");
    // A failed payment is no customer leaving.
    const unpaid: Moment = {
      id: "m",
      kind: "movement",
      movement: feedItem({ kind: "churn", churn: { reason: "unpaid", endsAt: null } }),
    };
    expect(momentAnnouncement(unpaid)).toBe("unpaid");
    expect(momentAnnouncement({ id: "t", kind: "test" })).toBe("payment");
  });

  it("leaves the summary of a burst to its sound and card", () => {
    expect(
      momentAnnouncement({
        id: "s",
        kind: "summary",
        accountId: "a1",
        payments: 4,
        changes: 0,
        customers: 0,
        revenue: 10_000,
        mrrChange: 0,
      }),
    ).toBeNull();
  });
});

describe("momentSpeech", () => {
  const settings = (voice: Partial<ScreenSettings["voice"]>, language = "en" as const) => ({
    voice: { ...defaultScreenSettings.voice, enabled: true, ...voice },
    language,
  });

  it("follows the main switch and each announcement's own", () => {
    expect(momentSpeech(payment(), settings({}))).toEqual({
      announcement: "payment",
      phrase: "payment",
      language: "en",
    });
    expect(momentSpeech(payment(), settings({ enabled: false }))).toBeNull();
    const quiet = { ...defaultScreenSettings.voice.announce, payment: false };
    expect(momentSpeech(payment(), settings({ announce: quiet }))).toBeNull();
    // A test celebration was asked for: only the main switch applies.
    expect(momentSpeech({ id: "t", kind: "test" }, settings({ announce: quiet }))).not.toBeNull();
  });

  it("says more for a goal than for a milestone", () => {
    const milestone = (isGoal: boolean): Moment => ({
      id: "m",
      kind: "milestone",
      amount: 1_000_000,
      metric: "mrr",
      isGoal,
      accountId: null,
    });
    expect(momentSpeech(milestone(false), settings({}))?.phrase).toBe("milestone");
    expect(momentSpeech(milestone(true), settings({}))?.phrase).toBe("goal");
  });

  it("says a cancellation at period end, or a pause, in phrases of their own", () => {
    const churn = (reason: "canceled" | "scheduled" | "paused"): Moment => ({
      id: "m",
      kind: "movement",
      movement: feedItem({ kind: "churn", churn: { reason, endsAt: null } }),
    });
    const loud = settings({
      announce: { ...defaultScreenSettings.voice.announce, cancellation: true },
    });
    expect(momentSpeech(churn("canceled"), loud)?.phrase).toBe("cancellation");
    expect(momentSpeech(churn("scheduled"), loud)?.phrase).toBe("cancellationScheduled");
    expect(momentSpeech(churn("paused"), loud)?.phrase).toBe("pause");
    // Losses stay quiet unless asked for.
    expect(momentSpeech(churn("scheduled"), settings({}))).toBeNull();
  });

  it("stays quiet in a language no voice speaks", () => {
    expect(momentSpeech(payment(), { ...settings({}), language: "it" })).toBeNull();
  });
});

describe("momentText", () => {
  it("says the customer's name only when the screen shows names", () => {
    expect(momentText(payment({ customerName: null }), screen())).toBe("Payment received: $49!");
    expect(momentText(payment({ customerName: "Ada Lovelace" }), screen())).toBe(
      "Ada Lovelace just paid $49!",
    );
  });

  it("says the screen's own phrases, in its language and currency", () => {
    const state = screen(
      { phrases: { subscription: ["{name} rejoint {plan} pour {amount} !"] } },
      { language: "fr" },
      { currency: "eur" },
    );
    const moment: Moment = {
      id: "payment:9",
      kind: "payment",
      payment: feedItem({ customerName: "Ada", amount: 123_456, planName: "Pro" }),
      movement: feedItem({ kind: "new", amount: 123_456 }),
    };
    expect(momentText(moment, state)).toBe("Ada rejoint Pro pour 1 234,56 € !");
  });

  it("names the product first on a screen with several", () => {
    const state = screen(
      {},
      {},
      {
        accounts: [
          { id: "a1", name: "Acme", status: "ready", livemode: true },
          { id: "a2", name: "Acme Mail", status: "ready", livemode: true },
        ],
      },
    );
    const customer: Moment = {
      id: "customer:1",
      kind: "customer",
      customer: feedItem({ kind: "customer", amount: 0, accountName: "Acme Mail" }),
    };
    expect(momentText(customer, state)).toBe("Acme Mail: New customer!");
  });

  it("says subscription changes in the screen's metric, without their sign", () => {
    const churn: Moment = {
      id: "movement:1",
      kind: "movement",
      movement: feedItem({ kind: "churn", amount: -4_900, planName: "Pro" }),
    };
    const state = screen(
      {
        announce: { ...defaultScreenSettings.voice.announce, cancellation: true },
        phrases: { cancellation: ["{amount} of ARR lost."] },
      },
      { metric: "arr" },
    );
    expect(momentText(churn, state)).toBe("$588 of ARR lost.");
  });

  it("says nothing for a moment its settings keep quiet", () => {
    expect(momentText(payment(), screen({ enabled: false }))).toBeNull();
  });
});

describe("spoken amounts and samples", () => {
  it("reads amounts exactly, with cents only when there are some", () => {
    expect(spokenMoney(4_900, "usd", "en-US")).toBe("$49");
    expect(spokenMoney(-4_950, "usd", "en-US")).toBe("$49.50");
    expect(spokenMoney(150_000_000, "usd", "en-US")).toBe("$1,500,000");
  });

  it("previews only the details an announcement knows", () => {
    expect(previewValues("customer", "en", { currency: "usd", product: "Acme" })).toEqual({
      name: "Ada Lovelace",
      country: "United States",
      product: "Acme",
    });
    expect(previewValues("milestone", "en", { currency: "usd", product: "Acme" })).toEqual({
      amount: "$10,000",
      product: "Acme",
    });
  });

  it("serves each recorded clip from its voice's folder", () => {
    expect(recordedClipUrl("marius", "goal")).toBe("/voices/marius/goal.mp3");
  });
});

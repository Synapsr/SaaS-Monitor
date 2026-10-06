import { describe, expect, it } from "vitest";
import type { Moment } from "@/lib/display/moments";
import { defaultScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { feedItem } from "@/test/display";
import { announcementUrl, momentAudio, soundClipUrl, type AudioSettings } from "./moment-audio";

const payment: Moment = {
  id: "payment:1",
  kind: "payment",
  payment: feedItem({ id: "payment:1", kind: "payment" }),
};

function settings({
  sound = {},
  voice = {},
  ...rest
}: {
  sound?: Partial<ScreenSettings["sound"]>;
  voice?: Partial<ScreenSettings["voice"]>;
} & Partial<Omit<AudioSettings, "sound" | "voice">> = {}): AudioSettings {
  return {
    ...defaultScreenSettings,
    ...rest,
    sound: { ...defaultScreenSettings.sound, ...sound },
    voice: { ...defaultScreenSettings.voice, enabled: true, ...voice },
  };
}

/** The screen's events, with one channel of `event` switched. */
function events(
  event: keyof ScreenSettings["events"],
  channels: Partial<ScreenSettings["events"]["payment"]>,
): ScreenSettings["events"] {
  const { events } = defaultScreenSettings;
  return { ...events, [event]: { ...events[event], ...channels } };
}

describe("momentAudio", () => {
  it("plays the sound, then says the recorded phrase once the sound has rung", () => {
    expect(momentAudio(payment, settings(), false)).toEqual({
      sound: { pack: "register", event: "payment", volume: 0.7 },
      voice: { id: "harper", phrase: "payment", volume: 0.8, delayMs: 900, announcement: null },
    });
  });

  it("asks for the screen's own words on a screen that says them", () => {
    const audio = momentAudio(payment, settings({ voice: { personalized: true } }), true);
    expect(audio?.voice?.announcement).toEqual({
      kind: "payment",
      id: "payment:1",
      paymentId: "payment:1",
    });
  });

  it("follows the screen's pack, voice, language and volumes", () => {
    const french = settings({
      language: "fr",
      sound: { pack: "arcade", volume: 0.4 },
      voice: { voiceId: "marius", volume: 0.5 },
    });
    expect(momentAudio(payment, french, false)).toEqual({
      sound: { pack: "arcade", event: "payment", volume: 0.4 },
      voice: { id: "marius", phrase: "payment", volume: 0.5, delayMs: 900, announcement: null },
    });
    // A voice of another language leaves the screen's language's first one speaking.
    expect(momentAudio(payment, settings({ language: "de" }), false)?.voice?.id).toBe("femke");
    // No voice speaks Italian: the sound plays alone.
    expect(momentAudio(payment, settings({ language: "it" }), false)?.voice).toBeNull();
  });

  it("follows the sound and voice switches, and each event's own", () => {
    const silent = momentAudio(payment, settings({ sound: { enabled: false } }), false);
    // Without a sound to wait for, the voice speaks at once.
    expect(silent).toMatchObject({ sound: null, voice: { delayMs: 0 } });
    expect(momentAudio(payment, settings({ voice: { enabled: false } }), false)?.voice).toBeNull();
    const quiet = settings({ events: events("payment", { sound: false, voice: false }) });
    expect(momentAudio(payment, quiet, false)).toBeNull();
  });

  it("lets a muted sound ring before the voice, as displays do", () => {
    const muted = momentAudio(payment, settings({ sound: { volume: 0 } }), false);
    expect(muted).toMatchObject({ sound: null, voice: { delayMs: 900 } });
    const mute = settings({ sound: { volume: 0 }, voice: { volume: 0 } });
    expect(momentAudio(payment, mute, false)).toBeNull();
  });

  it("plays a test celebration as a payment, and a goal as itself", () => {
    expect(momentAudio({ id: "test:1", kind: "test" }, settings(), true)).toEqual({
      sound: { pack: "register", event: "payment", volume: 0.7 },
      voice: {
        id: "harper",
        phrase: "payment",
        volume: 0.8,
        delayMs: 900,
        announcement: { kind: "test", id: "test:1" },
      },
    });
    const goal: Moment = {
      id: "milestone:mrr:1000000",
      kind: "milestone",
      amount: 1_000_000,
      metric: "mrr",
      isGoal: true,
      accountId: null,
    };
    expect(momentAudio(goal, settings(), false)).toMatchObject({
      sound: { event: "milestone" },
      voice: { phrase: "goal", delayMs: 1_600 },
    });
  });

  it("leaves the summary of a burst to its sound", () => {
    const summary: Moment = {
      id: "summary:payment:4",
      kind: "summary",
      accountId: "a1",
      events: ["payment"],
      payments: 4,
      changes: 0,
      customers: 0,
      revenue: 19_600,
      mrrChange: 0,
    };
    expect(momentAudio(summary, settings(), true)).toEqual({
      sound: { pack: "register", event: "payment", volume: 0.7 },
      voice: null,
    });
  });
});

describe("audio URLs", () => {
  it("are those every instance serves", () => {
    expect(soundClipUrl("chime", "mrrUp")).toBe("/sounds/chime/mrrUp.wav");
    expect(announcementUrl("a b")).toBe("/api/screens/a%20b/announcement");
  });
});

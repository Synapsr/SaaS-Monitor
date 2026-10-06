import type { ClipSource } from "@/audio/clips";
import { MomentAudioPlayer, type Clip, type ClipLoader } from "@/audio/moment-player";
import type { MomentAudio } from "@/contract/display/moment-audio";

const screen = { baseUrl: "https://saas-monitor.com", token: "token", accessProof: null };

const audio: MomentAudio = {
  sound: { pack: "register", event: "payment", volume: 0.5 },
  voice: { id: "harper", phrase: "payment", volume: 1, delayMs: 900, announcement: null },
};

/** Clips that load when told to, and remember when they played, at which volume. */
function fakeLoader({ duration = 1.5 } = {}) {
  const plays: { url: string; volume: number; at: number }[] = [];
  const released: string[] = [];
  const pending = new Map<string, { resolve: () => void; reject: () => void }>();
  const loader: ClipLoader = {
    load(source: ClipSource) {
      return new Promise<Clip>((resolve, reject) => {
        const clip: Clip = {
          duration,
          play: (volume) => plays.push({ url: source.url, volume, at: Date.now() }),
          release: () => released.push(source.url),
        };
        pending.set(source.url, { resolve: () => resolve(clip), reject: () => reject(new Error("gone")) });
      });
    },
  };
  /** Settles the load of `url`, and lets its callbacks run. */
  async function settle(url: string, outcome: "resolve" | "reject" = "resolve") {
    pending.get(url)?.[outcome]();
    pending.delete(url);
    await Promise.resolve();
    await Promise.resolve();
  }
  return { loader, plays, released, pending, settle };
}

const SOUND = "https://saas-monitor.com/sounds/register/payment.wav";
const VOICE = "https://saas-monitor.com/voices/harper/payment.mp3";
const ANNOUNCEMENT = "https://saas-monitor.com/api/screens/token/announcement";

describe("MomentAudioPlayer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-06T12:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("plays the sound at once, then the voice once the sound has rung, at squared volumes", async () => {
    const { loader, plays, settle } = fakeLoader();
    const start = Date.now();
    new MomentAudioPlayer(screen, loader).play(audio);
    await settle(SOUND);
    await settle(VOICE);
    expect(plays).toEqual([{ url: SOUND, volume: 0.25, at: start }]);

    jest.advanceTimersByTime(900);
    expect(plays.map(({ url, at }) => [url, at - start])).toEqual([
      [SOUND, 0],
      [VOICE, 900],
    ]);
  });

  it("drops a sound that could not start within a second: a late ka-ching would lie", async () => {
    const { loader, plays, released, settle } = fakeLoader();
    new MomentAudioPlayer(screen, loader).play({ ...audio, voice: null });
    jest.advanceTimersByTime(1_200);
    await settle(SOUND);
    expect(plays).toEqual([]);
    expect(released).toEqual([SOUND]);
  });

  it("says the screen's own words, or its recorded phrase when they can't be had", async () => {
    const own = { ...audio.voice!, announcement: { kind: "test" as const, id: "test:1" } };
    const { loader, plays, pending, settle } = fakeLoader();
    new MomentAudioPlayer(screen, loader).play({ sound: null, voice: own });
    expect([...pending.keys()]).toEqual([ANNOUNCEMENT]);
    await settle(ANNOUNCEMENT, "reject");
    await settle(VOICE);
    jest.advanceTimersByTime(900);
    expect(plays.map(({ url }) => url)).toEqual([VOICE]);
  });

  it("says one phrase at a time, a breath apart, and gives up on one that would wait too long", async () => {
    const { loader, plays, settle } = fakeLoader({ duration: 3 });
    const player = new MomentAudioPlayer(screen, loader);
    const start = Date.now();
    const speech = { sound: null, voice: { ...audio.voice!, delayMs: 0 } };
    player.play(speech);
    await settle(VOICE);
    player.play(speech);
    await settle(VOICE);
    player.play(speech);
    await settle(VOICE);

    jest.advanceTimersByTime(10_000);
    // The second waits for the first (3 s) and a breath (0.25 s); the third would wait 6.5 s.
    expect(plays.map(({ at }) => at - start)).toEqual([0, 3_250]);
  });

  it("silences everything when stopped, even what was still loading", async () => {
    const { loader, plays, released, settle } = fakeLoader();
    const player = new MomentAudioPlayer(screen, loader);
    player.play(audio);
    await settle(SOUND);
    player.stop();
    await settle(VOICE);
    jest.advanceTimersByTime(5_000);

    expect(plays.map(({ url }) => url)).toEqual([SOUND]);
    expect(released).toEqual([SOUND, VOICE]);
  });
});

import { announcementSource, cacheName, recordedSpeechSource, soundSource } from "@/audio/clips";
import type { MomentAudio } from "@/contract/display/moment-audio";

const screen = { baseUrl: "https://monitor.example.com/sm", token: "tok/en", accessProof: null };
const voice: NonNullable<MomentAudio["voice"]> = {
  id: "maelys",
  phrase: "subscription",
  volume: 0.8,
  delayMs: 800,
  announcement: { kind: "movement", id: "movement:1", movementId: "movement:1" },
};

describe("clip sources", () => {
  it("are the files the screen's instance serves", () => {
    expect(soundSource(screen, { pack: "chime", event: "mrrUp", volume: 0.5 })).toEqual({
      kind: "file",
      url: "https://monitor.example.com/sm/sounds/chime/mrrUp.wav",
    });
    expect(recordedSpeechSource(screen, voice)).toEqual({
      kind: "file",
      url: "https://monitor.example.com/sm/voices/maelys/subscription.mp3",
    });
  });

  it("ask the screen's server for its own words, in WAV, with the proof of its password", () => {
    expect(announcementSource({ ...screen, accessProof: "proof" }, voice)).toEqual({
      kind: "announcement",
      url: "https://monitor.example.com/sm/api/screens/tok%2Fen/announcement",
      headers: { "content-type": "application/json", "x-screen-access": "proof" },
      body: JSON.stringify({ moment: voice.announcement, format: "wav" }),
    });
    expect(announcementSource(screen, voice)).toMatchObject({
      headers: { "content-type": "application/json" },
    });
    expect(announcementSource(screen, { ...voice, announcement: null })).toBeNull();
  });
});

describe("cacheName", () => {
  it("names a URL's file the same every time, with its extension", () => {
    const sound = "https://saas-monitor.com/sounds/register/payment.wav";
    expect(cacheName(sound)).toBe(cacheName(sound));
    expect(cacheName(sound)).toMatch(/^[0-9a-f]{16}\.wav$/);
    expect(cacheName("https://saas-monitor.com/voices/harper/payment.mp3")).toMatch(/\.mp3$/);
    // Another instance serves other files.
    expect(cacheName("http://192.168.1.20:3000/sounds/register/payment.wav")).not.toBe(
      cacheName(sound),
    );
  });
});

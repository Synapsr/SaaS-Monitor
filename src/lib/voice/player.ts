import { MAX_SPEECH_LATENESS_MS, speechSlot } from "@/lib/display/audio-timing";
import { getAudioGraph } from "@/lib/sounds/graph";

/**
 * Plays what voices say through the shared audio graph, one phrase at a time. Safe to import on
 * the server: nothing touches `window` until something is said.
 */

/** Recorded clips, decoded once: a screen says the same few phrases all day. */
const clips = new Map<string, Promise<AudioBuffer>>();

/** When, in the audio context's time, the phrase being said ends. */
let busyUntil = 0;

/** Fetches and decodes a recorded clip, once. */
export function recordedClip(url: string): Promise<AudioBuffer> {
  let clip = clips.get(url);
  if (!clip) {
    clip = decodeSpeech(
      fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Voice clip ${url}: ${response.status}`);
        return response.arrayBuffer();
      }),
    );
    // A failed download may work next time.
    clip.catch(() => clips.delete(url));
    clips.set(url, clip);
  }
  return clip;
}

export async function decodeSpeech(audio: Promise<ArrayBuffer>): Promise<AudioBuffer> {
  const graph = getAudioGraph();
  if (!graph) throw new Error("Web Audio is not available");
  const data = await audio;
  // Callbacks too: Safari before 14.1, on older kiosks, returns no promise.
  return new Promise((resolve, reject) => {
    void graph.context.decodeAudioData(data, resolve, reject)?.catch(reject);
  });
}

/** Whether this browser decodes Ogg Opus, which synthesized phrases come in when it does. */
export function decodesOpus(): boolean {
  if (typeof document === "undefined") return false;
  return document.createElement("audio").canPlayType('audio/ogg; codecs="opus"') !== "";
}

export interface SpeakOptions {
  /** 0 to 1. */
  volume: number;
  /** Lets the moment's sound ring first. */
  delayMs: number;
}

/**
 * Says a phrase once it is ready, after the one being said. Never throws: a voice is a bonus, and
 * audio may be blocked until a user gesture.
 */
export function speak(speech: Promise<AudioBuffer>, { volume, delayMs }: SpeakOptions): void {
  const requestedAt = Date.now();
  speech
    .then(async (buffer) => {
      const graph = getAudioGraph();
      if (!graph || volume <= 0 || Date.now() - requestedAt > MAX_SPEECH_LATENESS_MS) return;
      const { context } = graph;
      // Inside a click (the settings' play buttons), resuming works right away.
      if (context.state !== "running") await context.resume();

      const slot = speechSlot({
        now: context.currentTime,
        elapsedMs: Date.now() - requestedAt,
        delayMs,
        busyUntil,
        duration: buffer.duration,
      });
      if (!slot) return;
      busyUntil = slot.busyUntil;

      const source = context.createBufferSource();
      source.buffer = buffer;
      const gain = context.createGain();
      // Squared, like sounds: the slider then feels even to the ear.
      gain.gain.value = volume ** 2;
      source.connect(gain).connect(graph.input);
      source.onended = () => gain.disconnect();
      source.start(slot.start);
    })
    .catch(() => {
      // Nothing to say after all: the moment still has its sound and card.
    });
}

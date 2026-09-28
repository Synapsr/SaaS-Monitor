import type { SoundPack } from "@/lib/screens/settings";
import { getAudioGraph, peekAudioGraph } from "@/lib/sounds/graph";
import { SOUND_RECIPES } from "@/lib/sounds/packs";

/**
 * Sounds of the wall display, synthesized with the Web Audio API: no audio files, no licensing.
 * Safe to import on the server: nothing touches `window` until a sound is played.
 */

export type SoundEvent = "payment" | "mrrUp" | "mrrDown" | "milestone";

/** How each pack is named, in the screen settings and on the landing page. */
export const SOUND_PACK_NAMES: Record<SoundPack, string> = {
  register: "Cash register",
  chime: "Chime",
  arcade: "Arcade",
};

export interface PlaySoundOptions {
  pack: SoundPack;
  /** 0 to 1. */
  volume: number;
}

/** A sound that could not start within this delay is dropped: a late "ka-ching" would lie. */
const MAX_START_DELAY_MS = 1_000;
/** Long enough for the longest sound and its reverb tail. */
const SOUND_LIFETIME_MS = 6_000;

/** Plays a sound of `pack`. Never throws: audio may be blocked until a user gesture. */
export function playSound(event: SoundEvent, options: PlaySoundOptions): void {
  try {
    const graph = getAudioGraph();
    const recipe = SOUND_RECIPES[options.pack]?.[event];
    const volume = Math.min(1, Math.max(0, options.volume));
    if (!graph || !recipe || volume === 0) return;

    const { context } = graph;
    const requestedAt = Date.now();
    const start = () => {
      if (Date.now() - requestedAt > MAX_START_DELAY_MS) return;
      // Squared: the slider then feels even to the ear, which hears loudness logarithmically.
      const output = context.createGain();
      output.gain.value = volume ** 2;
      output.connect(graph.input);
      const reverb = context.createGain();
      reverb.gain.value = volume ** 2;
      reverb.connect(graph.reverb);
      recipe({ context, output, reverb }, context.currentTime + 0.03);
      setTimeout(() => {
        output.disconnect();
        reverb.disconnect();
      }, SOUND_LIFETIME_MS);
    };

    if (context.state === "running") {
      start();
    } else {
      // Inside a click (a preview button of the settings page), resuming works right away.
      context
        .resume()
        .then(start)
        .catch(() => {});
    }
  } catch {
    // Sound is a bonus: it must never break a screen.
  }
}

/** Whether the browser currently allows audio (usually false until the first user gesture). */
export function isAudioUnlocked(): boolean {
  const graph = peekAudioGraph();
  if (graph) return graph.context.state === "running";
  if (typeof navigator === "undefined") return false;
  // Browsers implementing the Autoplay Policy Detection API (Firefox) tell without a context.
  const policy = (navigator as { getAutoplayPolicy?: (type: "audiocontext") => string })
    .getAutoplayPolicy;
  return policy?.call(navigator, "audiocontext") === "allowed";
}

/** Call from a user gesture handler (click, key press) to allow audio. */
export async function unlockAudio(): Promise<boolean> {
  const graph = getAudioGraph();
  if (!graph) return false;
  const { context } = graph;
  try {
    // iOS only unlocks audio when something plays during the gesture: a silent sample.
    const silence = context.createBufferSource();
    silence.buffer = context.createBuffer(1, 1, context.sampleRate);
    silence.connect(context.destination);
    silence.start();
    if (context.state !== "running") {
      await Promise.race([
        context.resume(),
        new Promise((resolve) => setTimeout(resolve, MAX_START_DELAY_MS)),
      ]);
    }
  } catch {
    // The browser refused: audio stays locked until the next gesture.
  }
  return context.state === "running";
}

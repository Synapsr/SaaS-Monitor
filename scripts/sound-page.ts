/**
 * The browser side of `scripts/generate-sounds.ts`, bundled into the page it opens in Chrome:
 * renders a sound offline through the wall display's own chain (room and compressor), at full
 * volume, and folds it to mono as one speaker plays it.
 */
import { createRandom } from "@/lib/display/random";
import type { SoundPack } from "@/lib/screens/settings";
import { scheduleSound, type SoundEvent } from "@/lib/sounds";
import { createMasterChain } from "@/lib/sounds/graph";
import { SOUND_RECIPES } from "@/lib/sounds/packs";

export interface SoundRendering {
  pack: SoundPack;
  event: SoundEvent;
  /** Seeds the noise (the room, the clicks of a till): the same file every time. */
  seed: number;
  sampleRate: number;
  seconds: number;
}

/** Mono samples as base64 of 32-bit floats: what crosses the DevTools protocol best. */
async function renderSound({ pack, event, seed, sampleRate, seconds }: SoundRendering) {
  const context = new OfflineAudioContext({
    numberOfChannels: 2,
    length: Math.round(sampleRate * seconds),
    sampleRate,
  });
  const random = Math.random;
  Math.random = createRandom(seed);
  try {
    scheduleSound({ context, ...createMasterChain(context) }, SOUND_RECIPES[pack][event], 1, 0);
  } finally {
    Math.random = random;
  }
  const rendered = await context.startRendering();
  const left = rendered.getChannelData(0);
  const right = rendered.getChannelData(1);
  const mono = new Float32Array(rendered.length);
  for (let index = 0; index < mono.length; index += 1) {
    mono[index] = (left[index] + right[index]) / 2;
  }
  const bytes = new Uint8Array(mono.buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

Object.assign(globalThis, { renderSound });

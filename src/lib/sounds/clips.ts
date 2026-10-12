import type { SoundPack } from "@/lib/screens/options";
import type { SoundEvent } from "@/lib/sounds";

/**
 * Where an instance serves a sound, rendered by `scripts/generate-sounds.ts`. On its own, for the
 * pages that only link to the files: what decides which sound a moment plays is far heavier.
 */
export function soundClipUrl(pack: SoundPack, event: SoundEvent): string {
  return `/sounds/${pack}/${event}.wav`;
}

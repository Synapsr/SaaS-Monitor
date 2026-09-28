import type { SoundPack } from "@/lib/screens/settings";

export type SoundEvent = "payment" | "mrrUp" | "mrrDown" | "milestone";

export interface PlaySoundOptions {
  pack: SoundPack;
  /** 0 to 1. */
  volume: number;
}

/** Plays a sound of `pack`. Never throws: audio may be blocked until a user gesture. */
export function playSound(event: SoundEvent, options: PlaySoundOptions): void {
  void event;
  void options;
}

/** Whether the browser currently allows audio (usually false until the first user gesture). */
export function isAudioUnlocked(): boolean {
  return false;
}

/** Call from a user gesture handler (click, key press) to allow audio. */
export async function unlockAudio(): Promise<boolean> {
  return false;
}

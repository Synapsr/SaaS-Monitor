import { useSyncExternalStore } from "react";
import { z } from "zod";
import { readPreference, writePreference } from "@/screens/storage";

/** This device's choices for the sounds and voices of screens. */
export interface AudioPreferences {
  /** "Play sounds and voices": an open screen plays its moments as its wall display does. */
  play: boolean;
}

const DEFAULTS: AudioPreferences = { play: false };

class AudioPreferencesStore {
  private preferences: AudioPreferences | null = null;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** `null` until read. */
  getSnapshot = (): AudioPreferences | null => this.preferences;

  async load(): Promise<void> {
    if (this.preferences !== null) return;
    const play = await readPreference("audio-play", z.boolean());
    this.set({ play: play ?? DEFAULTS.play });
  }

  update(change: Partial<AudioPreferences>): void {
    const next = { ...(this.preferences ?? DEFAULTS), ...change };
    this.set(next);
    void writePreference("audio-play", next.play);
  }

  private set(preferences: AudioPreferences) {
    this.preferences = preferences;
    for (const listener of this.listeners) listener();
  }
}

export const audioPreferencesStore = new AudioPreferencesStore();

export function useAudioPreferences(): AudioPreferences | null {
  return useSyncExternalStore(audioPreferencesStore.subscribe, audioPreferencesStore.getSnapshot);
}

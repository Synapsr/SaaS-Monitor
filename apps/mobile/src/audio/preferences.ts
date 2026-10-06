import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { z } from "zod";
import ScreenBridge from "../../modules/screen-bridge";
import { readPreference, writePreference } from "@/screens/storage";

/** This device's choices for the sounds and voices of screens. */
export interface AudioPreferences {
  /** "Play sounds and voices": an open screen plays its moments as its wall display does. */
  play: boolean;
  /** "Also when the phone is locked": notifications play them too (iOS), when `play` is on. */
  whenLocked: boolean;
}

/** Until the device's choices are read, and on a device that never made any. */
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = { play: false, whenLocked: false };
const DEFAULTS = DEFAULT_AUDIO_PREFERENCES;

/** Whether notifications play their moment's sound and voice. */
export function notificationAudio({ play, whenLocked }: AudioPreferences): boolean {
  return play && whenLocked;
}

/** Only the iPhone's notification service extension plays a moment as a notification's sound. */
export const PLAYS_NOTIFICATION_AUDIO = Platform.OS === "ios";

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
    const [play, whenLocked] = await Promise.all([
      readPreference("audio-play", z.boolean()),
      readPreference("audio-when-locked", z.boolean()),
    ]);
    this.set({ play: play ?? DEFAULTS.play, whenLocked: whenLocked ?? DEFAULTS.whenLocked });
  }

  update(change: Partial<AudioPreferences>): void {
    const next = { ...(this.preferences ?? DEFAULTS), ...change };
    this.set(next);
    void writePreference("audio-play", next.play);
    void writePreference("audio-when-locked", next.whenLocked);
  }

  private set(preferences: AudioPreferences) {
    this.preferences = preferences;
    // The extension reads it from the App Group, where the app's screens are too.
    if (PLAYS_NOTIFICATION_AUDIO) {
      ScreenBridge.setNotificationAudio(notificationAudio(preferences)).catch((error: unknown) =>
        console.warn("Notifications could not be told to play sounds", error),
      );
    }
    for (const listener of this.listeners) listener();
  }
}

export const audioPreferencesStore = new AudioPreferencesStore();

export function useAudioPreferences(): AudioPreferences | null {
  return useSyncExternalStore(audioPreferencesStore.subscribe, audioPreferencesStore.getSnapshot);
}

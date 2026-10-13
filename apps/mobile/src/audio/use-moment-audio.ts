import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { expoClips, prefetch } from "@/audio/expo-clips";
import { MomentAudioPlayer } from "@/audio/moment-player";
import { useAudioPreferences } from "@/audio/preferences";
import { SOUND_LEAD_MS } from "@/contract/display/audio-timing";
import { momentAudio, soundClipUrl } from "@/contract/display/moment-audio";
import type { Moment } from "@/contract/display/moments";
import type { DisplayState } from "@/contract/display/types";
import type { SoundEvent } from "@/contract/sounds";
import type { ScreenAccess } from "@/screens/api";

/** Every sound of a pack: those a moment's voice waits for. */
const SOUND_EVENTS = Object.keys(SOUND_LEAD_MS) as SoundEvent[];

function subscribeToAppState(listener: () => void): () => void {
  const subscription = AppState.addEventListener("change", listener);
  return () => subscription.remove();
}

/** Not in the background: in front, if only under the notification center. */
function useInFront(): boolean {
  return useSyncExternalStore(subscribeToAppState, () => AppState.currentState !== "background");
}

/** What a screen on display does with the sound and voice of its moments. */
export interface MomentAudioControls {
  play: (moment: Moment, state: DisplayState) => void;
  /** Silences the moment playing, e.g. when it is dismissed. */
  stop: () => void;
}

/**
 * Plays the moments of a screen on display as its wall display does, when this device asks for
 * it ("Play sounds and voices"). `access` says where the screen's sounds and voices come from;
 * `null` keeps it silent: the demo, a screen under a sheet. Everything stops when the screen
 * closes, and in the background.
 */
export function useMomentAudio(access: ScreenAccess | null, state: DisplayState): MomentAudioControls {
  const preferences = useAudioPreferences();
  const inFront = useInFront();
  const enabled = preferences?.play === true && inFront && access !== null;
  const { baseUrl, token, accessProof } = access ?? {};
  const player = useRef<MomentAudioPlayer | null>(null);

  useEffect(() => {
    if (!enabled || baseUrl === undefined || token === undefined) return;
    const current = new MomentAudioPlayer({ baseUrl, token, accessProof: accessProof ?? null }, expoClips);
    player.current = current;
    return () => {
      current.stop();
      if (player.current === current) player.current = null;
    };
  }, [enabled, baseUrl, token, accessProof]);

  // The first sound would be late, downloaded as its moment starts.
  const sound = state.screen.settings.sound;
  useEffect(() => {
    if (!enabled || !sound.enabled || baseUrl === undefined) return;
    prefetch(SOUND_EVENTS.map((event) => `${baseUrl}${soundClipUrl(sound.pack, event)}`));
  }, [enabled, baseUrl, sound.enabled, sound.pack]);

  const play = useCallback((moment: Moment, current: DisplayState) => {
    const audio = momentAudio(moment, current.screen.settings, current.personalizedVoice);
    if (audio) player.current?.play(audio);
  }, []);
  const stop = useCallback(() => player.current?.stop(), []);
  return useMemo(() => ({ play, stop }), [play, stop]);
}

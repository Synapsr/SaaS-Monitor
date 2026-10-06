import { SOUND_LEAD_MS } from "@/lib/display/audio-timing";
import { momentSound, type Moment } from "@/lib/display/moments";
import type { ScreenSettings, SoundPack } from "@/lib/screens/settings";
import type { SoundEvent } from "@/lib/sounds";
import type { Phrase } from "@/lib/voice/announcements";
import { momentSpeech } from "@/lib/voice/moment-speech";
import { momentRequest, type AnnouncementRequest } from "@/lib/voice/request";
import { screenVoice, type VoiceId } from "@/lib/voice/voices";

/**
 * What a moment plays, by the screen's settings: its sound, then its voice over the sound's tail.
 * Wall displays play it; so do the SaaS Monitor app and the notifications of the phones that ask
 * for it, from the files every instance serves.
 */
export interface MomentAudio {
  /** Played at once, at `volume` (0 to 1, squared as it plays: the slider feels even). */
  sound: { pack: SoundPack; event: SoundEvent; volume: number } | null;
  voice: {
    id: VoiceId;
    /** The recorded phrase it says, when the screen's own words can't be synthesized. */
    phrase: Phrase;
    /** 0 to 1, squared as it plays, like the sound's. */
    volume: number;
    /** Once the moment's sound has rung this long (`SOUND_LEAD_MS`), even when it is muted. */
    delayMs: number;
    /**
     * What to ask the screen's server to say in the screen's own words (`announcementUrl`), on a
     * screen that says them; `null` for recorded phrases.
     */
    announcement: AnnouncementRequest["moment"] | null;
  } | null;
}

export type AudioSettings = Pick<ScreenSettings, "events" | "sound" | "voice" | "language">;

/**
 * What a moment plays on a screen; `null` when it plays nothing. `personalizedVoice`: the screen
 * says its own phrases (`DisplayState.personalizedVoice`).
 */
export function momentAudio(
  moment: Moment,
  settings: AudioSettings,
  personalizedVoice: boolean,
): MomentAudio | null {
  const sound = momentSound(moment, settings);
  const speech = momentSpeech(moment, settings);
  const voice = speech && screenVoice(settings.language, settings.voice.voiceId);
  const audio: MomentAudio = {
    sound:
      sound && settings.sound.volume > 0
        ? { pack: settings.sound.pack, event: sound, volume: settings.sound.volume }
        : null,
    voice:
      speech && voice && settings.voice.volume > 0
        ? {
            id: voice.id,
            phrase: speech.phrase,
            volume: settings.voice.volume,
            delayMs: sound ? SOUND_LEAD_MS[sound] : 0,
            announcement: personalizedVoice ? momentRequest(moment) : null,
          }
        : null,
  };
  return audio.sound || audio.voice ? audio : null;
}

/** Where an instance serves a sound, rendered by `scripts/generate-sounds.ts`. */
export function soundClipUrl(pack: SoundPack, event: SoundEvent): string {
  return `/sounds/${pack}/${event}.wav`;
}

/** Where a screen's server says a moment in the screen's own words (`AnnouncementRequest`). */
export function announcementUrl(token: string): string {
  return `/api/screens/${encodeURIComponent(token)}/announcement`;
}

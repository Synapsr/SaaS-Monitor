import type { Moment } from "@/lib/display/moments";
import type { DisplayState } from "@/lib/display/types";
import type { SoundEvent } from "@/lib/sounds";
import { momentSpeech, recordedClipUrl } from "./moment-speech";
import { decodeSpeech, decodesOpus, recordedClip, speak } from "./player";
import { momentRequest, type AnnouncementRequest } from "./request";
import { screenVoice } from "./voices";

/** How long a moment's sound rings before its voice speaks over the tail. */
const SOUND_LEAD_MS: Record<SoundEvent, number> = {
  payment: 900,
  customer: 700,
  mrrUp: 800,
  mrrDown: 800,
  milestone: 1_600,
};

/**
 * Says what a moment announces, when the screen's settings ask for it: a recorded phrase, or the
 * screen's own, synthesized by its server at `endpoint` (the recorded one if that fails). `sound`
 * is the moment's sound, if one plays.
 */
export function announceMoment(
  moment: Moment,
  state: DisplayState,
  { endpoint, sound }: { endpoint: string | null; sound: SoundEvent | null },
): void {
  const { settings } = state.screen;
  const speech = momentSpeech(moment, settings);
  const voice = screenVoice(settings.language, settings.voice.voiceId);
  if (speech === null || voice === null) return;

  const recorded = () => recordedClip(recordedClipUrl(voice.id, speech.phrase));
  const request = momentRequest(moment);
  const audio =
    state.personalizedVoice && endpoint !== null && request !== null
      ? decodeSpeech(synthesized(endpoint, request)).catch(recorded)
      : recorded();
  speak(audio, { volume: settings.voice.volume, delayMs: sound ? SOUND_LEAD_MS[sound] : 0 });
}

async function synthesized(
  endpoint: string,
  moment: AnnouncementRequest["moment"],
): Promise<ArrayBuffer> {
  const body: AnnouncementRequest = { moment, format: decodesOpus() ? "opus" : "wav" };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Announcement: ${response.status}`);
  return response.arrayBuffer();
}

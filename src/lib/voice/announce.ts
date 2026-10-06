import { momentAudio } from "@/lib/display/moment-audio";
import type { Moment } from "@/lib/display/moments";
import type { DisplayState } from "@/lib/display/types";
import { recordedClipUrl } from "./moment-speech";
import { decodeSpeech, decodesOpus, recordedClip, speak } from "./player";
import type { AnnouncementRequest } from "./request";

/**
 * Says what a moment announces, when the screen's settings ask for it: a recorded phrase, or the
 * screen's own, synthesized by its server at `endpoint` (the recorded one if that fails), once the
 * moment's sound has rung.
 */
export function announceMoment(
  moment: Moment,
  state: DisplayState,
  { endpoint }: { endpoint: string | null },
): void {
  const voice = momentAudio(moment, state.screen.settings, state.personalizedVoice)?.voice;
  if (!voice) return;

  const recorded = () => recordedClip(recordedClipUrl(voice.id, voice.phrase));
  const audio =
    endpoint !== null && voice.announcement !== null
      ? decodeSpeech(synthesized(endpoint, voice.announcement)).catch(recorded)
      : recorded();
  speak(audio, { volume: voice.volume, delayMs: voice.delayMs });
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

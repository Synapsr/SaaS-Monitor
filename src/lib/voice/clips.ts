import type { Phrase } from "./announcements";
import type { VoiceId } from "./voices";

/**
 * Where the recorded clip of a phrase is served from (`scripts/generate-voices.ts`). On its own,
 * for the pages that play clips without saying moments: what writes a moment's speech is far
 * heavier, with every screen language.
 */
export function recordedClipUrl(voiceId: VoiceId, phrase: Phrase): string {
  return `/voices/${voiceId}/${phrase}.mp3`;
}

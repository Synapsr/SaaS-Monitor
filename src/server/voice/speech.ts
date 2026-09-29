import "server-only";
import type { Voice } from "@/lib/voice/voices";
import { synthesize, type Speech, type SpeechFormat } from "./gradium";

/**
 * Phrases synthesized lately, in this server's memory: every display of a screen asks for the
 * same announcement at once, and a phrase previewed in the settings is often played twice.
 */
const MAX_PHRASES = 200;

const phrases = new Map<string, Promise<Speech>>();

export interface SpeechRequest {
  text: string;
  voice: Voice;
  format: SpeechFormat;
}

function keyOf({ text, voice, format }: SpeechRequest): string {
  return `${voice.gradiumId}:${format}:${text}`;
}

/** The phrase, if it was synthesized lately or is being synthesized. */
export function recentSpeech(request: SpeechRequest): Promise<Speech> | undefined {
  const key = keyOf(request);
  const speech = phrases.get(key);
  if (speech) {
    // Most recently used last: the oldest phrases leave first.
    phrases.delete(key);
    phrases.set(key, speech);
  }
  return speech;
}

/** Synthesizes the phrase, and keeps it for the next displays that ask. */
export function synthesizeSpeech(request: SpeechRequest): Promise<Speech> {
  const key = keyOf(request);
  const speech = synthesize({
    text: request.text,
    gradiumId: request.voice.gradiumId,
    format: request.format,
  });
  phrases.set(key, speech);
  // A failure is not worth keeping: the next display tries again.
  speech.catch(() => phrases.delete(key));
  for (const oldest of phrases.keys()) {
    if (phrases.size <= MAX_PHRASES) break;
    phrases.delete(oldest);
  }
  return speech;
}

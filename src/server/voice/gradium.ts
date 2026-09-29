import "server-only";
import { env } from "@/env";

/** Gradium's text-to-speech, which says the phrases screens write themselves. */

export type SpeechFormat = "opus" | "wav";

export interface Speech {
  audio: ArrayBuffer;
  contentType: string;
}

/** A sentence takes a second or two: beyond this, the moment it announces is gone. */
const TIMEOUT_MS = 12_000;

/** Whether this server can synthesize phrases: it has a Gradium API key. */
export function canSynthesize(): boolean {
  return Boolean(env().GRADIUM_API_KEY);
}

/** Says `text` with a Gradium voice. Throws when Gradium fails or no key is configured. */
export async function synthesize({
  text,
  gradiumId,
  format,
}: {
  text: string;
  gradiumId: string;
  format: SpeechFormat;
}): Promise<Speech> {
  const { GRADIUM_API_KEY: key, GRADIUM_API_URL: url } = env();
  if (!key) throw new Error("GRADIUM_API_KEY is not set");

  const response = await fetch(`${url}/post/speech/tts`, {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    // Numbers, amounts and currencies are read by the rules of the voice's language.
    body: JSON.stringify({ text, voice_id: gradiumId, output_format: format, only_audio: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    // Errors come as plain text, e.g. "error from server 1008: API key is revoked or expired".
    const reason = (await response.text()).slice(0, 200);
    throw new Error(`Gradium answered ${response.status}: ${reason}`);
  }
  return {
    audio: await response.arrayBuffer(),
    contentType:
      response.headers.get("content-type") ?? `audio/${format === "opus" ? "ogg" : "wav"}`,
  };
}

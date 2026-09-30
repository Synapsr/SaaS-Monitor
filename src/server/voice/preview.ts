import "server-only";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { NAME_MAX_LENGTH } from "@/lib/names";
import { PHRASE_MAX_LENGTH } from "@/lib/screens/settings";
import { SCREEN_EVENTS } from "@/lib/display/events";
import { previewValues } from "@/lib/voice/moment-speech";
import { fillPhrase, phraseProblem } from "@/lib/voice/phrases";
import { VOICE_IDS, VOICES } from "@/lib/voice/voices";
import { createRateLimiter } from "@/server/rate-limit";
import { canSynthesize } from "./gradium";
import { recentSpeech, synthesizeSpeech } from "./speech";

/** A phrase of the screen editor, said with sample details. */
export const phrasePreviewSchema = z.object({
  voiceId: z.enum(VOICE_IDS),
  event: z.enum(SCREEN_EVENTS),
  phrase: z.string().trim().min(1, "Write a phrase to hear it.").max(PHRASE_MAX_LENGTH),
  currency: z.string().regex(/^[a-z]{3}$/),
  /** Stands for `{product}`: the screen's first Stripe account, or its name. */
  product: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  format: z.enum(["opus", "wav"]),
});

export type PhrasePreview = z.infer<typeof phrasePreviewSchema>;

/** Previews cost Gradium credits too: plenty to write a few phrases, not to loop. */
const previews = createRateLimiter({ limit: 40, windowMs: 10 * 60_000 });

/** The audio of a phrase, base64-encoded for the settings page to play. */
export async function previewPhrase(
  workspaceId: string,
  input: PhrasePreview,
): Promise<ActionResult<{ audio: string; contentType: string }>> {
  if (!canSynthesize()) {
    return { ok: false, error: "Add a Gradium API key to the server to hear your own phrases." };
  }
  const problem = phraseProblem(input.phrase, input.event);
  if (problem) return { ok: false, error: problem };

  const voice = VOICES.find(({ id }) => id === input.voiceId) ?? VOICES[0];
  const values = previewValues(input.event, voice.language, input);
  const text = fillPhrase(input.phrase, values);
  if (text === null) return { ok: false, error: "Write a phrase to hear it." };

  const request = { text, voice, format: input.format };
  const recent = recentSpeech(request);
  if (!recent && !previews.consume(workspaceId)) {
    return { ok: false, error: "That’s a lot of previews. Try again in a few minutes." };
  }
  try {
    const { audio, contentType } = await (recent ?? synthesizeSpeech(request));
    return { ok: true, audio: Buffer.from(audio).toString("base64"), contentType };
  } catch (error) {
    console.error("[voice] Could not synthesize a preview:", error);
    return { ok: false, error: "Gradium could not say this phrase. Try again in a moment." };
  }
}

import "server-only";
import { momentText } from "@/lib/voice/moment-speech";
import { requestedMoment, type AnnouncementRequest } from "@/lib/voice/request";
import { screenVoice } from "@/lib/voice/voices";
import { getRecentDisplayState } from "@/server/display/recent-state";
import { createRateLimiter } from "@/server/rate-limit";
import { canViewScreen, findScreenLock } from "@/server/screen-access";
import type { Speech } from "./gradium";
import { recentSpeech, synthesizeSpeech } from "./speech";

/**
 * Phrases a screen may have synthesized, beyond those every display shares: far more than a busy
 * business announces, while a screen's link can't run up the bill of the server's Gradium key.
 */
const syntheses = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

export type AnnouncementResult =
  | { outcome: "speech"; speech: Speech }
  | { outcome: "gone" | "locked" | "unavailable" | "unknown-moment" | "too-many" | "failed" };

/**
 * What a screen's voice says about one of its moments, in its own words. The display names the
 * moment; its items, their details and the phrase come from the screen itself.
 */
export async function screenAnnouncement(
  token: string,
  request: AnnouncementRequest,
  headers: Headers,
): Promise<AnnouncementResult> {
  const lock = await findScreenLock(token);
  if (!lock) return { outcome: "gone" };
  if (!(await canViewScreen(lock, headers))) return { outcome: "locked" };

  const state = await getRecentDisplayState(token).state;
  if (!state) return { outcome: "gone" };
  if (!state.personalizedVoice) return { outcome: "unavailable" };

  const moment = requestedMoment(request.moment, state);
  if (!moment) return { outcome: "unknown-moment" };
  const { settings } = state.screen;
  const voice = screenVoice(settings.language, settings.voice.voiceId);
  const text = momentText(moment, state);
  if (!voice || text === null) return { outcome: "unavailable" };

  const speechRequest = { text, voice, format: request.format };
  const recent = recentSpeech(speechRequest);
  if (!recent && !syntheses.consume(lock.screenId)) return { outcome: "too-many" };
  try {
    return { outcome: "speech", speech: await (recent ?? synthesizeSpeech(speechRequest)) };
  } catch (error) {
    console.error("[voice] Could not synthesize an announcement:", error);
    return { outcome: "failed" };
  }
}

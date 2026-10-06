import type { SoundEvent } from "@/lib/sounds";

/**
 * When a moment's sound and voice play, wherever they do: on a wall display, and in the SaaS
 * Monitor app, which follows the same timing.
 */

/** A sound that could not start within this delay is dropped: a late "ka-ching" would lie. */
export const MAX_SOUND_DELAY_MS = 1_000;

/** How long a moment's sound rings before its voice speaks over the tail. */
export const SOUND_LEAD_MS: Record<SoundEvent, number> = {
  payment: 900,
  customer: 700,
  mrrUp: 800,
  mrrDown: 800,
  milestone: 1_600,
};

/** A phrase waits its turn behind the one being said, but not longer than this. */
export const MAX_SPEECH_WAIT_S = 4;
/** Nor does it start this late: by then the moment it announces has left the screen. */
export const MAX_SPEECH_LATENESS_MS = 9_000;
/** A breath between two phrases. */
export const SPEECH_GAP_S = 0.25;

/**
 * When a phrase ready to be said starts, on a clock in seconds (`now`): once its moment's sound
 * has rung, `delayMs` after it was asked for (`elapsedMs` ago), and after the phrase being said,
 * which keeps the voice busy until `busyUntil`. Returns when the voice is busy again, or `null`
 * when the phrase would wait its turn too long to be said at all.
 */
export function speechSlot({
  now,
  elapsedMs,
  delayMs,
  busyUntil,
  duration,
}: {
  now: number;
  elapsedMs: number;
  delayMs: number;
  busyUntil: number;
  /** Of the phrase, in seconds. */
  duration: number;
}): { start: number; busyUntil: number } | null {
  const due = now + Math.max(0, delayMs - elapsedMs) / 1000;
  const start = Math.max(due, busyUntil);
  if (start - due > MAX_SPEECH_WAIT_S) return null;
  return { start, busyUntil: start + duration + SPEECH_GAP_S };
}

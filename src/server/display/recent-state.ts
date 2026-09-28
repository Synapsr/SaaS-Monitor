import "server-only";
import type { DisplayState } from "@/lib/display/types";
import { getDisplayStateByToken, isScreenToken } from "./state";

/**
 * Several displays often show the same screen, and a public URL can be polled too eagerly: polls
 * of a screen within this window share one computation instead of each querying the database.
 */
const SHARED_FOR_MS = 3_000;

const recentStates = new Map<string, { computedAt: number; state: Promise<DisplayState | null> }>();

/** The screen's state, and whether this call computed it (rather than reusing a recent one). */
export function getRecentDisplayState(token: string, now = Date.now()) {
  // Anyone can poll any token: only those a screen can have get an entry.
  if (!isScreenToken(token)) return { state: Promise.resolve(null), computed: false };

  for (const [key, entry] of recentStates) {
    if (now - entry.computedAt >= SHARED_FOR_MS) recentStates.delete(key);
  }

  const recent = recentStates.get(token);
  if (recent) return { state: recent.state, computed: false };

  const state = getDisplayStateByToken(token);
  recentStates.set(token, { computedAt: now, state });
  // A failure is not worth sharing: the next poll tries again.
  state.catch(() => recentStates.delete(token));
  return { state, computed: true };
}

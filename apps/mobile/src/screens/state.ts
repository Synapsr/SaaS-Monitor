import { isDisplayState } from "@/contract/display/state";
import type { DisplayState, FeedItem } from "@/contract/display/types";
import { parseScreenSettings } from "@/contract/screens/settings";

/** What a feed item of an older instance may lack: fields added since, empty. */
const ITEM_DEFAULTS: Omit<FeedItem, "id" | "kind" | "amount" | "occurredAt" | "accountId"> = {
  original: null,
  live: false,
  customerKey: null,
  customerName: null,
  customerEmail: null,
  country: null,
  planName: null,
  connect: null,
  customerSubscribed: null,
  churn: null,
  accountName: "",
};

/**
 * A polled response as the app renders it, or `null` when it isn't a display state (a captive
 * portal, a proxy's error page). Self-hosted instances may run an older or a newer version than
 * the app was built against: missing settings take their defaults, missing fields their empty
 * values, so that a screen never breaks on an upgrade of either side.
 */
export function readDisplayState(value: unknown): DisplayState | null {
  if (!isDisplayState(value)) return null;
  const state = value as DisplayState;
  return {
    ...state,
    screen: {
      name: typeof state.screen.name === "string" ? state.screen.name : "",
      settings: { ...parseScreenSettings(state.screen.settings), currency: state.currency },
    },
    views: Array.isArray(state.views) ? state.views : [],
    warnings: Array.isArray(state.warnings) ? state.warnings : [],
    testEvent: state.testEvent ?? null,
    personalizedVoice: state.personalizedVoice === true,
    feed: state.feed.map((item) => ({ ...ITEM_DEFAULTS, ...item })),
  };
}

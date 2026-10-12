import type { DisplayState } from "@/contract/display/types";
import type { ShareSubject } from "@/share/subjects";

/** What the share sheet of a screen opens on. */
export interface ShareRequest {
  subject: ShareSubject;
  /** The slide on screen: one account of a rotation, or the total. */
  slide: string;
  /** The screen as it was: the image shows what was held, not what came since. */
  state: DisplayState;
  /** When, in milliseconds: the image's date. */
  at: number;
}

/*
 * Handed from a screen to its share sheet in memory: a screen's state is too large for a route's
 * parameters, and never needs to outlive the app.
 */
const requests = new Map<string, ShareRequest>();

/** Hands a request to the share sheet of a screen, dated now. */
export function setShareRequest(key: string, request: Omit<ShareRequest, "at">): void {
  requests.set(key, { ...request, at: Date.now() });
}

export function shareRequest(key: string): ShareRequest | undefined {
  return requests.get(key);
}

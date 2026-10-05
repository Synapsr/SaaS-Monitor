import "server-only";

/** What Apple or Google answered for one notification. */
export type NativeResult =
  | { status: "sent" }
  /** The token no longer reaches the app: the phone's native token is forgotten. */
  | { status: "unregistered" }
  /** Anything else: the phone may still hear of it through Expo. */
  | { status: "failed"; reason: string };

/** Native pushes are best effort too: a slow answer is given up on. */
export const NATIVE_TIMEOUT_MS = 10_000;

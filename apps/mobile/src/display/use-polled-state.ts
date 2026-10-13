import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { POLL_INTERVAL_MS, retryDelay } from "@/contract/display/backoff";
import type { DisplayState } from "@/contract/display/types";
import { fetchScreenState, type ScreenAccess } from "@/screens/api";

/**
 * - `connecting`: no answer yet.
 * - `online`: the last poll succeeded.
 * - `offline`: polls keep failing; the last state stays on screen.
 * - `gone`: the link no longer works (the screen was deleted, or its link regenerated).
 * - `locked`: the screen asks for a password this device doesn't know (any more).
 */
export type Connection = "connecting" | "online" | "offline" | "gone" | "locked";

/** One failed poll is a hiccup; two in a row are worth showing. */
const OFFLINE_AFTER_FAILURES = 2;

interface PolledState {
  state: DisplayState | null;
  connection: Connection;
  /** Polls now; resolves once the answer is in (pull to refresh). */
  refresh: () => Promise<void>;
}

/**
 * Keeps a screen's state fresh like a wall display: every 10 seconds, backing off (with jitter)
 * while it fails. Polls stop in the background and resume at once when the app comes back.
 */
export function usePolledState(access: ScreenAccess | null): PolledState {
  const [state, setState] = useState<DisplayState | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");
  const pollNow = useRef<() => Promise<void>>(async () => {});

  const { baseUrl, token, accessProof } = access ?? {};
  useEffect(() => {
    if (baseUrl === undefined || token === undefined) return;
    const screen = { baseUrl, token, accessProof: accessProof ?? null };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let failures = 0;
    let disposed = false;
    let active = AppState.currentState !== "background";

    const schedule = (delay: number) => {
      clearTimeout(timer);
      if (!disposed && active) timer = setTimeout(() => void poll(), delay);
    };

    async function poll(): Promise<void> {
      clearTimeout(timer);
      controller?.abort();
      const current = (controller = new AbortController());
      let result;
      try {
        result = await fetchScreenState(screen, { signal: current.signal });
      } catch {
        return; // Replaced by a newer poll, or the screen was closed.
      }
      if (disposed || current.signal.aborted) return;

      switch (result.kind) {
        case "ok":
          failures = 0;
          setState(result.state);
          setConnection("online");
          break;
        case "gone":
        case "locked":
          failures += 1;
          setConnection(result.kind);
          break;
        case "failed":
          failures += 1;
          setConnection((previous) => {
            if (previous === "gone" || previous === "locked") return previous;
            // Without anything to show yet, say so at once rather than spin.
            if (previous === "connecting" || failures >= OFFLINE_AFTER_FAILURES) return "offline";
            return previous;
          });
      }
      schedule(failures === 0 ? POLL_INTERVAL_MS : retryDelay(failures));
    }

    pollNow.current = poll;
    void poll();
    const subscription = AppState.addEventListener("change", (next) => {
      const wasActive = active;
      active = next === "active";
      if (active && !wasActive) void poll();
      if (!active) {
        clearTimeout(timer);
        controller?.abort();
      }
    });
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      subscription.remove();
      pollNow.current = async () => {};
    };
  }, [baseUrl, token, accessProof]);

  const refresh = useCallback(() => pollNow.current(), []);
  return { state, connection, refresh };
}

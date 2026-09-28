import { useEffect, useState } from "react";
import { POLL_INTERVAL_MS, retryDelay } from "@/lib/display/backoff";
import { isDisplayState } from "@/lib/display/state";
import type { DisplayState } from "@/lib/display/types";

/**
 * - `online`: the last poll succeeded.
 * - `offline`: polls keep failing; the last data stays on screen.
 * - `gone`: the server no longer knows this screen (deleted, or its link was regenerated).
 */
export type Connection = "online" | "offline" | "gone";

const REQUEST_TIMEOUT_MS = 15_000;
/** One failed poll is a hiccup; two in a row are worth showing. */
const OFFLINE_AFTER_FAILURES = 2;

/**
 * Keeps a screen's state fresh by polling its endpoint, forever: failures back off (with jitter)
 * and recovery is immediate when the network or the page comes back.
 */
export function usePolledState(
  token: string,
  initialState: DisplayState,
): { state: DisplayState; connection: Connection } {
  const [state, setState] = useState(initialState);
  const [connection, setConnection] = useState<Connection>("online");

  useEffect(() => {
    const url = `/api/screens/${encodeURIComponent(token)}/state`;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let latest = 0;
    let failures = 0;
    let disposed = false;

    const schedule = (delay: number) => {
      clearTimeout(timer);
      if (!disposed) timer = setTimeout(poll, delay);
    };

    async function poll() {
      const request = ++latest;
      controller?.abort();
      const current = (controller = new AbortController());
      const timeout = setTimeout(() => current.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          cache: "no-store",
          headers: { accept: "application/json" },
          signal: current.signal,
        });
        if (response.status === 404) {
          if (request !== latest) return;
          failures += 1;
          setConnection("gone");
        } else {
          const data: unknown = response.ok ? await response.json() : null;
          if (!isDisplayState(data)) throw new Error(`Unexpected response (${response.status})`);
          if (request !== latest) return;
          failures = 0;
          setState(data);
          setConnection("online");
        }
      } catch {
        // A newer poll replaced this one, or the display was closed.
        if (request !== latest || disposed) return;
        failures += 1;
        if (failures >= OFFLINE_AFTER_FAILURES) {
          setConnection((previous) => (previous === "gone" ? previous : "offline"));
        }
      } finally {
        clearTimeout(timeout);
      }
      schedule(failures === 0 ? POLL_INTERVAL_MS : retryDelay(failures));
    }

    // Back from sleep, or the network is back: no need to wait for the next attempt.
    const pollNow = () => {
      if (document.visibilityState === "visible") schedule(0);
    };

    schedule(POLL_INTERVAL_MS);
    window.addEventListener("online", pollNow);
    document.addEventListener("visibilitychange", pollNow);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      window.removeEventListener("online", pollNow);
      document.removeEventListener("visibilitychange", pollNow);
    };
  }, [token]);

  return { state, connection };
}

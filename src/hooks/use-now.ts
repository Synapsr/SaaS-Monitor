import { useSyncExternalStore } from "react";

interface Clock {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
}

/** One clock per interval, shared by every component that reads it: they re-render together. */
const clocks = new Map<number, Clock>();

function clock(interval: number): Clock {
  let existing = clocks.get(interval);
  if (!existing) {
    let now = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const listeners = new Set<() => void>();
    existing = {
      subscribe(listener) {
        listeners.add(listener);
        if (listeners.size === 1) {
          now = Date.now();
          timer = setInterval(() => {
            now = Date.now();
            for (const notify of listeners) notify();
          }, interval);
        }
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0) clearInterval(timer);
        };
      },
      getSnapshot: () => now,
    };
    clocks.set(interval, existing);
  }
  return existing;
}

/**
 * The current time in milliseconds, refreshed every `interval`. The server and the hydration
 * render both use `serverTime`, so they agree; the device clock takes over right after.
 */
export function useNow(serverTime: number, interval: number): number {
  const { subscribe, getSnapshot } = clock(interval);
  return useSyncExternalStore(subscribe, getSnapshot, () => serverTime);
}

import { useSyncExternalStore } from "react";

interface Clock {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
}

/** The time, refreshed every `interval` while components listen (`useNow` on the web). */
function createClock(interval: number): Clock {
  let now = Date.now();
  let timer: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<() => void>();
  return {
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
    getSnapshot() {
      // Read afresh, at most once per interval, so that consecutive reads agree.
      if (listeners.size === 0 && Date.now() - now >= interval) now = Date.now();
      return now;
    },
  };
}

/** One clock per interval, shared by every component that reads it: they re-render together. */
const clocks = new Map<number, Clock>();

/** The current time in milliseconds, refreshed every `interval`. */
export function useNow(interval: number): number {
  let clock = clocks.get(interval);
  if (!clock) {
    clock = createClock(interval);
    clocks.set(interval, clock);
  }
  return useSyncExternalStore(clock.subscribe, clock.getSnapshot);
}

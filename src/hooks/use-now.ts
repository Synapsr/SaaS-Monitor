import { useSyncExternalStore } from "react";

interface Clock {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
}

/**
 * The time in milliseconds, refreshed every `interval` while components listen. A component may
 * render before any listens, e.g. a dashboard mounting once an import completes: the time is then
 * read afresh, at most once per interval so that consecutive reads agree, as React requires.
 */
export function createClock(interval: number): Clock {
  let now = 0;
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
      if (listeners.size === 0 && Date.now() - now >= interval) now = Date.now();
      return now;
    },
  };
}

/** One clock per interval, shared by every component that reads it: they re-render together. */
const clocks = new Map<number, Clock>();

function clock(interval: number): Clock {
  let existing = clocks.get(interval);
  if (!existing) {
    existing = createClock(interval);
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

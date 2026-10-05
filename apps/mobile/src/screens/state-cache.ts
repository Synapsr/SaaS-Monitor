import { useSyncExternalStore } from "react";
import type { DisplayState } from "@/contract/display/types";

/*
 * The last state of each screen, in memory: what a screen's settings show of it (the events it
 * sends to phones) without fetching it again.
 */

const states = new Map<string, DisplayState>();
const listeners = new Set<() => void>();

export function cacheState(key: string, state: DisplayState): void {
  if (states.get(key) === state) return;
  states.set(key, state);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCachedState(key: string | undefined): DisplayState | undefined {
  return useSyncExternalStore(subscribe, () => (key === undefined ? undefined : states.get(key)));
}

import { useSyncExternalStore } from "react";

type FlagStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * A flag that stays raised in this browser once raised: a hint dismissed, a tip already seen.
 * Storage can be missing or throw (private windows, blocked site data): the flag then lives in
 * memory until the page is left, which is all a hint needs.
 */
export function createStoredFlag(key: string, storage: () => FlagStorage) {
  let raisedHere = false;
  const listeners = new Set<() => void>();
  return {
    isRaised(): boolean {
      if (raisedHere) return true;
      try {
        return storage().getItem(key) !== null;
      } catch {
        return false;
      }
    },
    raise(): void {
      raisedHere = true;
      try {
        storage().setItem(key, new Date().toISOString());
      } catch {
        // Remembered in memory only.
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type StoredFlag = ReturnType<typeof createStoredFlag>;

// One flag per key, so every component reading it re-renders when one of them raises it.
const flags = new Map<string, StoredFlag>();

function storedFlag(key: string): StoredFlag {
  let flag = flags.get(key);
  if (!flag) {
    flag = createStoredFlag(key, () => window.localStorage);
    flags.set(key, flag);
  }
  return flag;
}

/** The server cannot read the browser's storage: it renders the flag lowered. */
export function useStoredFlag(key: string): [raised: boolean, raise: () => void] {
  const flag = storedFlag(key);
  const raised = useSyncExternalStore(flag.subscribe, flag.isRaised, () => false);
  return [raised, flag.raise];
}

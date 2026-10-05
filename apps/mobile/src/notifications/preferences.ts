import * as Crypto from "expo-crypto";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { readPreference, writePreference } from "@/screens/storage";

/*
 * What this device keeps about notifications for every screen: the id instances know it by, and
 * whether its notifications are paused.
 */

let installation: Promise<string> | null = null;

/** Generated once and kept: instances name this device by it, whatever its tokens become. */
export function installationId(): Promise<string> {
  installation ??= (async () => {
    const saved = await readPreference("installation-id", z.uuid());
    if (saved) return saved;
    const id = Crypto.randomUUID();
    await writePreference("installation-id", id);
    return id;
  })();
  return installation;
}

/** "Pause notifications": every screen silent on this device, their own switches kept. */
class PauseStore {
  private paused: boolean | null = null;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** `null` until read. */
  getSnapshot = (): boolean | null => this.paused;

  async load(): Promise<void> {
    if (this.paused !== null) return;
    this.set((await readPreference("notifications-paused", z.boolean())) ?? false);
  }

  setPaused(paused: boolean): void {
    this.set(paused);
    void writePreference("notifications-paused", paused);
  }

  private set(paused: boolean) {
    this.paused = paused;
    for (const listener of this.listeners) listener();
  }
}

export const pauseStore = new PauseStore();

export function useNotificationsPaused(): boolean | null {
  return useSyncExternalStore(pauseStore.subscribe, pauseStore.getSnapshot);
}

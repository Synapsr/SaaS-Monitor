import { useSyncExternalStore } from "react";
import { deleteScreen, loadScreens, writeOrder, writeScreen } from "@/screens/storage";
import type { SavedScreen } from "@/screens/types";

export interface ScreensSnapshot {
  /** `false` until the keychain was read: nothing to show nor decide before. */
  ready: boolean;
  screens: readonly SavedScreen[];
}

/** What a screen may change once added: not its link. */
export type ScreenPatch = Partial<Omit<SavedScreen, "key" | "token" | "baseUrl" | "addedAt">>;

/** `screens` with `key` moved `offset` places, within bounds. */
export function moveScreen<T extends { key: string }>(
  screens: readonly T[],
  key: string,
  offset: number,
): T[] {
  const from = screens.findIndex((screen) => screen.key === key);
  if (from === -1) return [...screens];
  const to = Math.min(screens.length - 1, Math.max(0, from + offset));
  const moved = [...screens];
  const [screen] = moved.splice(from, 1);
  moved.splice(to, 0, screen);
  return moved;
}

/**
 * The screens of the device, for React (`useScreens`) and everything else (notifications, the
 * widgets' bridge). Changes show at once; writes to the keychain follow, one at a time, in order.
 */
class ScreensStore {
  private snapshot: ScreensSnapshot = { ready: false, screens: [] };
  private readonly listeners = new Set<() => void>();
  private writes: Promise<void> = Promise.resolve();
  private loading: Promise<void> | null = null;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): ScreensSnapshot => this.snapshot;

  find(key: string): SavedScreen | undefined {
    return this.snapshot.screens.find((screen) => screen.key === key);
  }

  load(): Promise<void> {
    this.loading ??= loadScreens()
      .catch((error: unknown) => {
        console.warn("Screens could not be read", error);
        return [];
      })
      .then((screens) => this.set(screens));
    return this.loading;
  }

  /** Adds a screen at the end, or refreshes it when the device has it already. */
  add(screen: SavedScreen): void {
    const existing = this.find(screen.key);
    const screens = existing
      ? this.snapshot.screens.map((other) => (other.key === screen.key ? screen : other))
      : [...this.snapshot.screens, screen];
    this.set(screens);
    this.persist(async () => {
      await writeScreen(screen);
      if (!existing) await writeOrder(screens.map(({ key }) => key));
    });
  }

  update(key: string, patch: ScreenPatch): void {
    const current = this.find(key);
    if (!current) return;
    const updated = { ...current, ...patch };
    if (JSON.stringify(updated) === JSON.stringify(current)) return;
    this.set(this.snapshot.screens.map((screen) => (screen.key === key ? updated : screen)));
    this.persist(() => writeScreen(updated));
  }

  remove(key: string): void {
    if (!this.find(key)) return;
    const screens = this.snapshot.screens.filter((screen) => screen.key !== key);
    this.set(screens);
    this.persist(async () => {
      await writeOrder(screens.map((screen) => screen.key));
      await deleteScreen(key);
    });
  }

  move(key: string, offset: number): void {
    const screens = moveScreen(this.snapshot.screens, key, offset);
    this.set(screens);
    this.persist(() => writeOrder(screens.map((screen) => screen.key)));
  }

  private set(screens: readonly SavedScreen[]) {
    this.snapshot = { ready: true, screens };
    for (const listener of this.listeners) listener();
  }

  private persist(write: () => Promise<void>) {
    this.writes = this.writes.then(write).catch((error: unknown) => {
      console.warn("Screens could not be saved", error);
    });
  }
}

export const screensStore = new ScreensStore();

export function useScreens(): ScreensSnapshot {
  return useSyncExternalStore(screensStore.subscribe, screensStore.getSnapshot);
}

export function useScreen(key: string | undefined): SavedScreen | undefined {
  const { screens } = useScreens();
  return screens.find((screen) => screen.key === key);
}

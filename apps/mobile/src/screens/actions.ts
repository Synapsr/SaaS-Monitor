import type { DisplayState } from "@/contract/display/types";
import type { ScreenEvent } from "@/contract/display/events";
import { unregisterScreen } from "@/notifications/devices";
import { installationId } from "@/notifications/preferences";
import { notificationsStore } from "@/notifications/status";
import { fetchScreenState, unlockScreen, type UnlockResult } from "@/screens/api";
import { screenKey } from "@/screens/key";
import { cacheState } from "@/screens/state-cache";
import type { ScreenLink } from "@/screens/link";
import { screensStore } from "@/screens/store";
import type { ScreenAppearance } from "@/screens/types";

/* What people do with their screens, from the screens of the app. */

export type AddResult =
  | { kind: "added"; key: string; first: boolean }
  /** The screen asks for its password: add it again with one. */
  | { kind: "locked" }
  | Exclude<UnlockResult, { kind: "unlocked" }>;

export function appearanceOf(state: DisplayState): ScreenAppearance {
  const { theme, accent, language } = state.screen.settings;
  return { theme, accent, language };
}

/**
 * Adds the screen of a link, once its instance shows it: its state names it. A screen added
 * again keeps its name on this device, its switch and the proof of its password.
 */
export async function addScreen(link: ScreenLink, password?: string): Promise<AddResult> {
  const key = await screenKey(link.token);
  const existing = screensStore.find(key);
  let accessProof = existing?.accessProof ?? null;
  if (password !== undefined) {
    const unlock = await unlockScreen(link, password);
    if (unlock.kind !== "unlocked") return unlock;
    accessProof = unlock.proof;
  }

  const result = await fetchScreenState({ ...link, accessProof });
  if (result.kind !== "ok") return result;
  const first = screensStore.getSnapshot().screens.length === 0;
  screensStore.add({
    key,
    baseUrl: link.baseUrl,
    token: link.token,
    accessProof,
    name: result.state.screen.name,
    alias: existing?.alias ?? null,
    notify: existing?.notify ?? true,
    mutedEvents: existing?.mutedEvents ?? [],
    appearance: appearanceOf(result.state),
    addedAt: existing?.addedAt ?? new Date().toISOString(),
  });
  return { kind: "added", key, first: first && !existing };
}

/** Opens a saved screen that asks for its password, new or changed since. */
export async function unlockSavedScreen(key: string, password: string): Promise<UnlockResult> {
  const screen = screensStore.find(key);
  if (!screen) return { kind: "gone" };
  const result = await unlockScreen(screen, password);
  if (result.kind === "unlocked") screensStore.update(key, { accessProof: result.proof });
  return result;
}

/** Keeps the name and look of a screen as its instance sends them. */
export function rememberState(key: string, state: DisplayState): void {
  cacheState(key, state);
  screensStore.update(key, { name: state.screen.name, appearance: appearanceOf(state) });
}

export function renameScreen(key: string, alias: string): void {
  const screen = screensStore.find(key);
  if (!screen) return;
  const trimmed = alias.trim();
  screensStore.update(key, { alias: trimmed === "" || trimmed === screen.name ? null : trimmed });
}

/**
 * "Notifications on this device", for one screen. The registrations follow the screens: the
 * instance hears of it at once.
 */
export function setScreenNotifications(key: string, notify: boolean): void {
  screensStore.update(key, { notify });
}

/** Whether this device hears of one of the screen's events. */
export function setEventMuted(key: string, event: ScreenEvent, muted: boolean): void {
  const screen = screensStore.find(key);
  if (!screen) return;
  const others = screen.mutedEvents.filter((other) => other !== event);
  screensStore.update(key, { mutedEvents: muted ? [...others, event] : others });
}

/** Forgets a screen on this device, and its notifications. The screen itself stays. */
export async function removeScreen(key: string): Promise<void> {
  const screen = screensStore.find(key);
  if (!screen) return;
  screensStore.remove(key);
  // Without tokens, its instance never heard of this device.
  if (notificationsStore.getSnapshot().kind === "ready") {
    await unregisterScreen(screen, await installationId());
  }
}

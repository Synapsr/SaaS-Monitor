import { getLocales } from "expo-localization";
import { Platform } from "react-native";
import { z } from "zod";
import { registerDevice, unregisterDevice, type ScreenAccess } from "@/screens/api";
import { readPreference, writePreference } from "@/screens/storage";
import type { SavedScreen } from "@/screens/types";

/*
 * Which screens notify this device, on their instances (`PUT`/`DELETE …/devices`). Registering is
 * idempotent: each screen is registered once per launch, and again when its proof or the push
 * token changes. Unregistering may fail offline: it is kept and tried again at the next launch.
 */

/** What a screen was registered with, by key, during this launch. */
const registered = new Map<string, string>();

function signature(screen: SavedScreen, pushToken: string): string {
  return JSON.stringify([pushToken, screen.baseUrl, screen.accessProof]);
}

/** The screens to register now: those that notify, unless registered as they are. */
export function screensToRegister(
  screens: readonly SavedScreen[],
  pushToken: string,
  done: ReadonlyMap<string, string>,
): SavedScreen[] {
  return screens.filter(
    (screen) => screen.notify && done.get(screen.key) !== signature(screen, pushToken),
  );
}

function deviceLocale(): string | undefined {
  return getLocales()[0]?.languageTag ?? undefined;
}

/** Registers every screen that notifies and isn't yet, one at a time. */
export async function registerScreens(
  screens: readonly SavedScreen[],
  pushToken: string,
): Promise<void> {
  const platform = Platform.OS === "android" ? "android" : "ios";
  for (const screen of screensToRegister(screens, pushToken, registered)) {
    const ok = await registerDevice(screen, { pushToken, platform, locale: deviceLocale() });
    if (ok) registered.set(screen.key, signature(screen, pushToken));
  }
}

const pendingSchema = z.array(
  z.object({
    baseUrl: z.string(),
    token: z.string(),
    accessProof: z.string().nullable(),
    pushToken: z.string(),
  }),
);
type PendingUnregistration = z.infer<typeof pendingSchema>[number];

const PENDING = "pending-unregistrations";

async function readPending(): Promise<PendingUnregistration[]> {
  return (await readPreference(PENDING, pendingSchema)) ?? [];
}

/**
 * Stops the notifications of a screen on this device: it was removed, or its switch turned off.
 * Without a push token, the device was never registered: nothing to undo.
 */
export async function unregisterScreen(screen: ScreenAccess & { key: string }, pushToken: string | null) {
  registered.delete(screen.key);
  if (pushToken === null) return;
  const access = { baseUrl: screen.baseUrl, token: screen.token, accessProof: screen.accessProof };
  if (await unregisterDevice(access, pushToken)) return;
  await writePreference(PENDING, [...(await readPending()), { ...access, pushToken }]);
}

/** Tries the unregistrations that failed before again; keeps those that fail again. */
export async function retryUnregistrations(): Promise<void> {
  const pending = await readPending();
  if (pending.length === 0) return;
  const failed: PendingUnregistration[] = [];
  for (const { pushToken, ...access } of pending) {
    if (!(await unregisterDevice(access, pushToken))) failed.push({ ...access, pushToken });
  }
  await writePreference(PENDING, failed);
}

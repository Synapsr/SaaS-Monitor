import { getLocales } from "expo-localization";
import { Platform } from "react-native";
import { z } from "zod";
import type { PushTokens } from "@/notifications/status";
import { registerDevice, unregisterDevice, type DeviceRegistration, type ScreenAccess } from "@/screens/api";
import { readPreference, writePreference } from "@/screens/storage";
import type { SavedScreen } from "@/screens/types";

/*
 * What each screen's instance knows of this device (`PUT`/`DELETE …/devices`): its tokens and
 * its choices for the screen. Registering is idempotent: each screen is registered once per
 * launch, then again whenever a token, its proof or a choice changes. Unregistering may fail
 * offline: it is kept and tried again at the next launch.
 */

export interface DeviceContext {
  installationId: string;
  tokens: PushTokens;
  /** "Pause notifications", for every screen of the device. */
  paused: boolean;
}

/** What a screen's instance is told, from the screen's choices and the device's. */
export function registrationOf(screen: SavedScreen, device: DeviceContext): DeviceRegistration {
  const { pushToken, deviceToken, apnsEnvironment } = device.tokens;
  return {
    installationId: device.installationId,
    platform: Platform.OS === "android" ? "android" : "ios",
    ...(pushToken ? { pushToken } : {}),
    ...(deviceToken ? { deviceToken } : {}),
    ...(deviceToken && apnsEnvironment ? { apnsEnvironment } : {}),
    locale: getLocales()[0]?.languageTag ?? undefined,
    enabled: screen.notify && !device.paused,
    mutedEvents: screen.mutedEvents,
  };
}

/** What was registered for each screen during this launch, by key. */
const registered = new Map<string, string>();

function signature(screen: SavedScreen, registration: DeviceRegistration): string {
  return JSON.stringify([screen.baseUrl, screen.accessProof, registration]);
}

/** The screens whose instance doesn't know this device as it is now. */
export function screensToRegister(
  screens: readonly SavedScreen[],
  device: DeviceContext,
  done: ReadonlyMap<string, string> = registered,
): SavedScreen[] {
  return screens.filter(
    (screen) => done.get(screen.key) !== signature(screen, registrationOf(screen, device)),
  );
}

/** Tells every screen's instance about this device, those that need it, one at a time. */
export async function registerScreens(
  screens: readonly SavedScreen[],
  device: DeviceContext,
): Promise<void> {
  for (const screen of screensToRegister(screens, device)) {
    const registration = registrationOf(screen, device);
    if (await registerDevice(screen, registration)) {
      registered.set(screen.key, signature(screen, registration));
    }
  }
}

const pendingSchema = z.array(
  z.object({
    baseUrl: z.string(),
    token: z.string(),
    accessProof: z.string().nullable(),
    installationId: z.string(),
  }),
);
type PendingUnregistration = z.infer<typeof pendingSchema>[number];

const PENDING = "pending-unregistrations";

async function readPending(): Promise<PendingUnregistration[]> {
  return (await readPreference(PENDING, pendingSchema)) ?? [];
}

/** The device stops following a removed screen; offline, it is tried again later. */
export async function unregisterScreen(
  screen: ScreenAccess & { key: string },
  installationId: string,
): Promise<void> {
  registered.delete(screen.key);
  const access = { baseUrl: screen.baseUrl, token: screen.token, accessProof: screen.accessProof };
  if (await unregisterDevice(access, installationId)) return;
  await writePreference(PENDING, [...(await readPending()), { ...access, installationId }]);
}

/** Tries the unregistrations that failed before again; keeps those that fail again. */
export async function retryUnregistrations(): Promise<void> {
  const pending = await readPending();
  if (pending.length === 0) return;
  const failed: PendingUnregistration[] = [];
  for (const { installationId, ...access } of pending) {
    if (!(await unregisterDevice(access, installationId))) failed.push({ ...access, installationId });
  }
  await writePreference(PENDING, failed);
}

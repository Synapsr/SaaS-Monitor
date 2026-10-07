import "server-only";
import { and, desc, eq, inArray, isNull, ne, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, type Transaction } from "@/db";
import { APNS_ENVIRONMENTS, PUSH_PLATFORMS, pushDevices } from "@/db/schema";
import { DEMO_TOKEN } from "@/lib/display/demo/business";
import { SCREEN_EVENTS, type ScreenEvent } from "@/lib/display/events";
import { clientAddress, createRateLimiter } from "@/server/rate-limit";
import { canViewScreen, findScreenLock } from "@/server/screen-access";

/*
 * The phones following a screen with the SaaS Monitor app. The app has no account: the screen's
 * link (and its password, if it has one) is all it needs to register, like a wall display. Each
 * phone is an installation of the app, with the tokens Apple, Google or Expo deliver to.
 */

/** `ExponentPushToken[…]`, or `ExpoPushToken[…]` as newer Expo SDKs may write it. */
const expoTokenSchema = z
  .string()
  .max(255)
  .regex(/^Expo(nent)?PushToken\[[\w-]+\]$/, "Not an Expo push token.");

/** Tokens are opaque: their alphabet is checked loosely, their length strictly. */
const NATIVE_TOKENS = {
  /** APNs: hexadecimal, 32 bytes today, up to 100 by Apple's word. */
  ios: /^[0-9a-f]{64,200}$/i,
  /** FCM registration tokens: about 160 URL-safe characters, with `:`. */
  android: /^[\w:-]{100,512}$/,
} as const;

export const deviceRegistrationSchema = z
  .object({
    installationId: z.uuid(),
    platform: z.enum(PUSH_PLATFORMS),
    pushToken: expoTokenSchema.optional(),
    deviceToken: z.string().max(512).optional(),
    apnsEnvironment: z.enum(APNS_ENVIRONMENTS).optional(),
    /** BCP 47, e.g. `fr-FR`. */
    locale: z
      .string()
      .max(35)
      .regex(/^[a-z]{2,3}(-[a-z0-9]{1,8})*$/i)
      .optional(),
    enabled: z.boolean().default(true),
    mutedEvents: z
      .array(z.enum(SCREEN_EVENTS))
      .max(SCREEN_EVENTS.length)
      .default([])
      .transform((events) => [...new Set(events)]),
  })
  .superRefine((device, context) => {
    if (!device.pushToken && !device.deviceToken) {
      context.addIssue({
        code: "custom",
        message: "A phone needs a push token or a device token.",
      });
    }
    if (device.deviceToken && !NATIVE_TOKENS[device.platform].test(device.deviceToken)) {
      context.addIssue({ code: "custom", path: ["deviceToken"], message: "Not a device token." });
    }
    if (device.apnsEnvironment && device.platform !== "ios") {
      context.addIssue({ code: "custom", path: ["apnsEnvironment"], message: "iOS only." });
    }
  });

export type DeviceRegistration = z.infer<typeof deviceRegistrationSchema>;

export const deviceRemovalSchema = z.object({ installationId: z.uuid() });

/**
 * A screen notifies this many phones at most: past it, the one whose app was opened the longest
 * ago gives way. A team has far fewer; anyone with the link can register one.
 */
export const MAX_DEVICES_PER_SCREEN = 50;

/** The app registers at every launch: plenty for a team behind one address, and no more. */
const registrations = createRateLimiter({ limit: 30, windowMs: 60 * 60_000 });

export type RegistrationResult = "registered" | "gone" | "locked" | "too-many-registrations";

/**
 * Lets a phone follow a screen, or confirms it still does with its current tokens and choices:
 * the app calls it at every launch, and whenever they change. A password-protected screen asks
 * for the proof of its password, like its state does. The demo screen accepts every phone, as
 * any screen does, but keeps none: its simulation records nothing, so it notifies nobody.
 */
export async function registerDevice(
  token: string,
  device: DeviceRegistration,
  headers: Headers,
): Promise<RegistrationResult> {
  if (token === DEMO_TOKEN) {
    const allowed = registrations.consume(`${DEMO_TOKEN}:${clientAddress(headers)}`);
    return allowed ? "registered" : "too-many-registrations";
  }
  const lock = await findScreenLock(token);
  if (!lock) return "gone";
  if (!(await canViewScreen(lock, headers))) return "locked";
  if (!registrations.consume(`${lock.screenId}:${clientAddress(headers)}`)) {
    return "too-many-registrations";
  }

  const { screenId } = lock;
  const values = {
    platform: device.platform,
    pushToken: device.pushToken ?? null,
    deviceToken: device.deviceToken ?? null,
    // Store builds use Apple's production host; development builds say otherwise.
    apnsEnvironment:
      device.platform === "ios" && device.deviceToken
        ? (device.apnsEnvironment ?? "production")
        : null,
    locale: device.locale ?? null,
    enabled: device.enabled,
    mutedEvents: device.mutedEvents,
  };
  await db().transaction(async (tx) => {
    await tx
      .insert(pushDevices)
      .values({ screenId, installationId: device.installationId, ...values })
      .onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
    // A reinstalled app is a new installation with the phone's tokens: the old one is gone.
    const sameTokens: SQL[] = [];
    if (values.pushToken) sameTokens.push(eq(pushDevices.pushToken, values.pushToken));
    if (values.deviceToken) sameTokens.push(eq(pushDevices.deviceToken, values.deviceToken));
    await tx
      .delete(pushDevices)
      .where(
        and(
          eq(pushDevices.screenId, screenId),
          ne(pushDevices.installationId, device.installationId),
          or(...sameTokens),
        ),
      );
    const devices = await tx
      .select({ id: pushDevices.id })
      .from(pushDevices)
      .where(eq(pushDevices.screenId, screenId))
      .orderBy(desc(pushDevices.updatedAt), desc(pushDevices.createdAt));
    const evicted = devices.slice(MAX_DEVICES_PER_SCREEN).map(({ id }) => id);
    if (evicted.length) await tx.delete(pushDevices).where(inArray(pushDevices.id, evicted));
  });
  return "registered";
}

/**
 * Stops notifying a phone. Its installation id is all it takes: it is the app's own secret, and
 * removing it reveals nothing, so a screen's password is not asked for. The demo kept none.
 */
export async function unregisterDevice(
  token: string,
  installationId: string,
): Promise<"removed" | "gone"> {
  if (token === DEMO_TOKEN) return "removed";
  const lock = await findScreenLock(token);
  if (!lock) return "gone";
  await db()
    .delete(pushDevices)
    .where(
      and(eq(pushDevices.screenId, lock.screenId), eq(pushDevices.installationId, installationId)),
    );
  return "removed";
}

/**
 * Forgets the phones of a screen whose link was regenerated, or whose password changed: like the
 * screen's displays, they must open it again with the new one.
 */
export async function forgetScreenDevices(tx: Transaction, screenId: string): Promise<void> {
  await tx.delete(pushDevices).where(eq(pushDevices.screenId, screenId));
}

/**
 * Forgets tokens that no longer reach a phone (the app was removed), on every screen: Expo tokens
 * Expo reports, device tokens Apple or Google report. A phone left with no token is forgotten.
 */
export async function forgetTokens({
  pushTokens = [],
  deviceTokens = [],
}: {
  pushTokens?: readonly string[];
  deviceTokens?: readonly string[];
}): Promise<void> {
  if (!pushTokens.length && !deviceTokens.length) return;
  await db().transaction(async (tx) => {
    if (pushTokens.length) {
      await tx
        .update(pushDevices)
        .set({ pushToken: null })
        .where(inArray(pushDevices.pushToken, [...new Set(pushTokens)]));
    }
    if (deviceTokens.length) {
      await tx
        .update(pushDevices)
        .set({ deviceToken: null, apnsEnvironment: null })
        .where(inArray(pushDevices.deviceToken, [...new Set(deviceTokens)]));
    }
    await tx
      .delete(pushDevices)
      .where(and(isNull(pushDevices.pushToken), isNull(pushDevices.deviceToken)));
  });
}

/** A phone as the notifier reaches it, for one screen it follows. */
export interface Device {
  installationId: string;
  platform: (typeof PUSH_PLATFORMS)[number];
  pushToken: string | null;
  deviceToken: string | null;
  apnsEnvironment: (typeof APNS_ENVIRONMENTS)[number] | null;
  enabled: boolean;
  mutedEvents: ScreenEvent[];
}

/** The phones following each screen, oldest registration first. */
export async function screenDevices(screenIds: readonly string[]): Promise<Map<string, Device[]>> {
  const devices = new Map<string, Device[]>();
  if (!screenIds.length) return devices;
  const rows = await db()
    .select({
      screenId: pushDevices.screenId,
      installationId: pushDevices.installationId,
      platform: pushDevices.platform,
      pushToken: pushDevices.pushToken,
      deviceToken: pushDevices.deviceToken,
      apnsEnvironment: pushDevices.apnsEnvironment,
      enabled: pushDevices.enabled,
      mutedEvents: pushDevices.mutedEvents,
    })
    .from(pushDevices)
    .where(inArray(pushDevices.screenId, [...screenIds]))
    .orderBy(pushDevices.createdAt);
  for (const { screenId, ...device } of rows) {
    devices.set(screenId, [...(devices.get(screenId) ?? []), device]);
  }
  return devices;
}

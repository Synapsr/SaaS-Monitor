import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, type Transaction } from "@/db";
import { PUSH_PLATFORMS, pushDevices } from "@/db/schema";
import { clientAddress, createRateLimiter } from "@/server/rate-limit";
import { canViewScreen, findScreenLock } from "@/server/screen-access";

/*
 * The phones following a screen with the SaaS Monitor app. The app has no account: the screen's
 * link (and its password, if it has one) is all it needs to register, like a wall display.
 */

/** `ExponentPushToken[…]`, or `ExpoPushToken[…]` as newer Expo SDKs may write it. */
const pushTokenSchema = z
  .string()
  .max(255)
  .regex(/^Expo(nent)?PushToken\[[\w-]+\]$/, "Not an Expo push token.");

export const deviceRegistrationSchema = z.object({
  pushToken: pushTokenSchema,
  platform: z.enum(PUSH_PLATFORMS),
  /** BCP 47, e.g. `fr-FR`. */
  locale: z
    .string()
    .max(35)
    .regex(/^[a-z]{2,3}(-[a-z0-9]{1,8})*$/i)
    .optional(),
});

export type DeviceRegistration = z.infer<typeof deviceRegistrationSchema>;

export const deviceRemovalSchema = z.object({ pushToken: pushTokenSchema });

/**
 * A screen notifies this many phones at most: past it, the one whose app was opened the longest
 * ago gives way. A team has far fewer; anyone with the link can register one.
 */
export const MAX_DEVICES_PER_SCREEN = 50;

/** The app registers at every launch: plenty for a team behind one address, and no more. */
const registrations = createRateLimiter({ limit: 30, windowMs: 60 * 60_000 });

export type RegistrationResult = "registered" | "gone" | "locked" | "too-many-registrations";

/**
 * Lets a phone follow a screen, or confirms it still does: the app calls it at every launch.
 * A password-protected screen asks for the proof of its password, like its state does.
 */
export async function registerDevice(
  token: string,
  { pushToken, platform, ...device }: DeviceRegistration,
  headers: Headers,
): Promise<RegistrationResult> {
  const lock = await findScreenLock(token);
  if (!lock) return "gone";
  if (!(await canViewScreen(lock, headers))) return "locked";
  if (!registrations.consume(`${lock.screenId}:${clientAddress(headers)}`)) {
    return "too-many-registrations";
  }

  const locale = device.locale ?? null;
  await db().transaction(async (tx) => {
    await tx
      .insert(pushDevices)
      .values({ screenId: lock.screenId, pushToken, platform, locale })
      .onDuplicateKeyUpdate({ set: { platform, locale, updatedAt: new Date() } });
    const devices = await tx
      .select({ id: pushDevices.id })
      .from(pushDevices)
      .where(eq(pushDevices.screenId, lock.screenId))
      .orderBy(desc(pushDevices.updatedAt), desc(pushDevices.createdAt));
    const evicted = devices.slice(MAX_DEVICES_PER_SCREEN).map((device) => device.id);
    if (evicted.length) await tx.delete(pushDevices).where(inArray(pushDevices.id, evicted));
  });
  return "registered";
}

/**
 * Stops notifying a phone. Its push token is all it takes: it is the phone's own secret, and
 * removing it reveals nothing, so a screen's password is not asked for.
 */
export async function unregisterDevice(
  token: string,
  pushToken: string,
): Promise<"removed" | "gone"> {
  const lock = await findScreenLock(token);
  if (!lock) return "gone";
  await db()
    .delete(pushDevices)
    .where(and(eq(pushDevices.screenId, lock.screenId), eq(pushDevices.pushToken, pushToken)));
  return "removed";
}

/**
 * Forgets the phones of a screen whose link was regenerated, or whose password changed: like the
 * screen's displays, they must open it again with the new one.
 */
export async function forgetScreenDevices(tx: Transaction, screenId: string): Promise<void> {
  await tx.delete(pushDevices).where(eq(pushDevices.screenId, screenId));
}

/** Forgets push tokens that no longer reach a phone (the app was removed), on every screen. */
export async function forgetPushTokens(pushTokens: readonly string[]): Promise<void> {
  if (!pushTokens.length) return;
  await db()
    .delete(pushDevices)
    .where(inArray(pushDevices.pushToken, [...new Set(pushTokens)]));
}

/** The push tokens of the phones following each screen, oldest registration first. */
export async function screenDevices(screenIds: readonly string[]): Promise<Map<string, string[]>> {
  const devices = new Map<string, string[]>();
  if (!screenIds.length) return devices;
  const rows = await db()
    .select({ screenId: pushDevices.screenId, pushToken: pushDevices.pushToken })
    .from(pushDevices)
    .where(inArray(pushDevices.screenId, [...screenIds]))
    .orderBy(pushDevices.createdAt);
  for (const { screenId, pushToken } of rows) {
    devices.set(screenId, [...(devices.get(screenId) ?? []), pushToken]);
  }
  return devices;
}

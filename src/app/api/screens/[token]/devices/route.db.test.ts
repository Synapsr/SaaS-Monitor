import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { pushDevices } from "@/db/schema";
import { unlockScreen } from "@/server/screen-access";
import { setScreenPassword } from "@/server/screens";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import { DELETE, PUT } from "./route";

const INSTALLATION = "6f1c2c1e-6a43-4f0e-9a4b-3f6d7f0e2a11";
const EXPO_TOKEN = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]";
const APNS_TOKEN = "a1".repeat(32);
const FCM_TOKEN = `cX9k2Lq8RzW:APA91b${"F".repeat(140)}`;

function call(
  handler: typeof PUT,
  token: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return handler(
    new Request(`http://localhost/api/screens/${token}/devices`, {
      method: handler === PUT ? "PUT" : "DELETE",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ token }) },
  );
}

function devicesOf(screenId: string) {
  return db()
    .select({
      installationId: pushDevices.installationId,
      platform: pushDevices.platform,
      pushToken: pushDevices.pushToken,
      deviceToken: pushDevices.deviceToken,
      apnsEnvironment: pushDevices.apnsEnvironment,
      locale: pushDevices.locale,
      enabled: pushDevices.enabled,
      mutedEvents: pushDevices.mutedEvents,
    })
    .from(pushDevices)
    .where(eq(pushDevices.screenId, screenId))
    .orderBy(asc(pushDevices.createdAt));
}

async function screen() {
  const { workspaceId } = await createUserWithWorkspace();
  return { workspaceId, ...(await createScreen(workspaceId)) };
}

describe("devices endpoint", () => {
  beforeEach(resetDatabase);

  it("registers an installation once, keeping its latest tokens and choices", async () => {
    const { id, token } = await screen();

    const first = await call(PUT, token, {
      installationId: INSTALLATION,
      platform: "ios",
      pushToken: EXPO_TOKEN,
      locale: "fr-FR",
    });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true });
    const again = await call(PUT, token, {
      installationId: INSTALLATION,
      platform: "ios",
      pushToken: EXPO_TOKEN,
      deviceToken: APNS_TOKEN,
      apnsEnvironment: "development",
      enabled: false,
      mutedEvents: ["customer", "customer", "milestone"],
    });
    expect(again.status).toBe(200);

    expect(await devicesOf(id)).toEqual([
      {
        installationId: INSTALLATION,
        platform: "ios",
        pushToken: EXPO_TOKEN,
        deviceToken: APNS_TOKEN,
        apnsEnvironment: "development",
        locale: null,
        enabled: false,
        mutedEvents: ["customer", "milestone"],
      },
    ]);
  });

  it("registers an Android phone by its FCM token alone, notified by default", async () => {
    const { id, token } = await screen();

    const response = await call(PUT, token, {
      installationId: INSTALLATION,
      platform: "android",
      deviceToken: FCM_TOKEN,
    });

    expect(response.status).toBe(200);
    expect(await devicesOf(id)).toEqual([
      expect.objectContaining({
        deviceToken: FCM_TOKEN,
        pushToken: null,
        apnsEnvironment: null,
        enabled: true,
        mutedEvents: [],
      }),
    ]);
  });

  it("takes an iOS device token for Apple's production host unless told otherwise", async () => {
    const { id, token } = await screen();
    await call(PUT, token, {
      installationId: INSTALLATION,
      platform: "ios",
      deviceToken: APNS_TOKEN,
    });
    expect(await devicesOf(id)).toEqual([
      expect.objectContaining({ apnsEnvironment: "production" }),
    ]);
  });

  it("asks for the proof of a protected screen's password", async () => {
    const { workspaceId, id, token } = await screen();
    await setScreenPassword(workspaceId, id, "4321");
    const device = { installationId: INSTALLATION, platform: "android", pushToken: EXPO_TOKEN };

    expect((await call(PUT, token, device)).status).toBe(401);
    const unlocked = await unlockScreen(token, "4321", new Headers());
    if (unlocked.outcome !== "unlocked" || !unlocked.cookie) throw new Error("Not unlocked.");
    const proof = { "x-screen-access": unlocked.cookie.value };
    expect((await call(PUT, token, device, proof)).status).toBe(200);

    expect(await devicesOf(id)).toHaveLength(1);
  });

  it("refuses phones it could not reach, and tokens of the wrong shape or size", async () => {
    const { id, token } = await screen();
    const ios = { installationId: INSTALLATION, platform: "ios" };

    for (const body of [
      ios,
      { ...ios, installationId: "not-a-uuid", pushToken: EXPO_TOKEN },
      { ...ios, pushToken: "not-a-token" },
      { ...ios, pushToken: `${EXPO_TOKEN}<script>` },
      { ...ios, deviceToken: "a1".repeat(20) },
      { ...ios, deviceToken: "zz".repeat(32) },
      { ...ios, deviceToken: "a1".repeat(101) },
      { ...ios, platform: "android", deviceToken: "short" },
      { ...ios, platform: "android", deviceToken: "x".repeat(513) },
      { ...ios, platform: "android", deviceToken: FCM_TOKEN, apnsEnvironment: "production" },
      { ...ios, platform: "windows", pushToken: EXPO_TOKEN },
      { ...ios, pushToken: EXPO_TOKEN, mutedEvents: ["everything"] },
      { ...ios, pushToken: EXPO_TOKEN, locale: "fr_FR; drop" },
      null,
    ]) {
      expect((await call(PUT, token, body)).status, JSON.stringify(body)).toBe(400);
    }
    expect(await devicesOf(id)).toEqual([]);
  });

  it("stops notifying an installation that unregisters, and only that one", async () => {
    const { id, token } = await screen();
    const other = "0b7e8c52-34f0-4e57-8f0d-6d2f0b6c9a77";
    await call(PUT, token, {
      installationId: INSTALLATION,
      platform: "ios",
      pushToken: EXPO_TOKEN,
    });
    await call(PUT, token, { installationId: other, platform: "android", deviceToken: FCM_TOKEN });

    const response = await call(DELETE, token, { installationId: INSTALLATION });

    expect(response.status).toBe(204);
    expect((await devicesOf(id)).map(({ installationId }) => installationId)).toEqual([other]);
    // Already gone: nothing more to do.
    expect((await call(DELETE, token, { installationId: INSTALLATION })).status).toBe(204);
    expect((await call(DELETE, token, { installationId: "nope" })).status).toBe(400);
  });

  it("answers 404 for an unknown screen", async () => {
    const device = { installationId: INSTALLATION, platform: "ios", pushToken: EXPO_TOKEN };
    expect((await call(PUT, "unknown", device)).status).toBe(404);
    expect((await call(DELETE, "unknown", { installationId: INSTALLATION })).status).toBe(404);
  });
});

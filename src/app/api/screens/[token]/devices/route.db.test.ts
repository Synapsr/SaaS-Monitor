import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { pushDevices } from "@/db/schema";
import { unlockScreen } from "@/server/screen-access";
import { setScreenPassword } from "@/server/screens";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import { DELETE, PUT } from "./route";

const PHONE = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]";

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
      pushToken: pushDevices.pushToken,
      platform: pushDevices.platform,
      locale: pushDevices.locale,
    })
    .from(pushDevices)
    .where(eq(pushDevices.screenId, screenId))
    .orderBy(asc(pushDevices.createdAt));
}

describe("devices endpoint", () => {
  beforeEach(resetDatabase);

  it("registers a phone once, however often the app launches", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { id, token } = await createScreen(workspaceId);

    const first = await call(PUT, token, { pushToken: PHONE, platform: "ios", locale: "fr-FR" });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true });
    const again = await call(PUT, token, { pushToken: PHONE, platform: "ios", locale: "en-GB" });
    expect(again.status).toBe(200);

    expect(await devicesOf(id)).toEqual([{ pushToken: PHONE, platform: "ios", locale: "en-GB" }]);
  });

  it("asks for the proof of a protected screen's password", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { id, token } = await createScreen(workspaceId);
    await setScreenPassword(workspaceId, id, "4321");
    const device = { pushToken: PHONE, platform: "android" };

    expect((await call(PUT, token, device)).status).toBe(401);
    const unlocked = await unlockScreen(token, "4321", new Headers());
    if (unlocked.outcome !== "unlocked" || !unlocked.cookie) throw new Error("Not unlocked.");
    const proof = { "x-screen-access": unlocked.cookie.value };
    expect((await call(PUT, token, device, proof)).status).toBe(200);

    expect(await devicesOf(id)).toEqual([{ pushToken: PHONE, platform: "android", locale: null }]);
  });

  it("refuses what is no Expo push token, or no phone", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { id, token } = await createScreen(workspaceId);

    for (const body of [
      { pushToken: "not-a-token", platform: "ios" },
      { pushToken: `${PHONE}<script>`, platform: "ios" },
      { pushToken: PHONE, platform: "windows" },
      { pushToken: PHONE, platform: "ios", locale: "fr_FR; drop" },
      null,
    ]) {
      expect((await call(PUT, token, body)).status, JSON.stringify(body)).toBe(400);
    }
    expect(await devicesOf(id)).toEqual([]);
  });

  it("stops notifying a phone that unregisters, and only that one", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { id, token } = await createScreen(workspaceId);
    const other = "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]";
    await call(PUT, token, { pushToken: PHONE, platform: "ios" });
    await call(PUT, token, { pushToken: other, platform: "android" });

    const response = await call(DELETE, token, { pushToken: PHONE });

    expect(response.status).toBe(204);
    expect(await devicesOf(id)).toEqual([{ pushToken: other, platform: "android", locale: null }]);
    // Already gone: nothing more to do.
    expect((await call(DELETE, token, { pushToken: PHONE })).status).toBe(204);
  });

  it("answers 404 for an unknown screen", async () => {
    expect((await call(PUT, "unknown", { pushToken: PHONE, platform: "ios" })).status).toBe(404);
    expect((await call(DELETE, "unknown", { pushToken: PHONE })).status).toBe(404);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { pushDevices } from "@/db/schema";
import { regenerateScreenToken, setScreenPassword } from "@/server/screens";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import {
  deviceRegistrationSchema,
  forgetTokens,
  MAX_DEVICES_PER_SCREEN,
  registerDevice,
  screenDevices,
  type DeviceRegistration,
} from "./devices";

/** The `n`th phone: an installation with its Expo token, and its own address. */
function phone(n: number, input: Partial<DeviceRegistration> = {}): DeviceRegistration {
  return deviceRegistrationSchema.parse({
    installationId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    platform: "ios",
    pushToken: `ExponentPushToken[phone-${n}]`,
    ...input,
  });
}

const from = (address: string) => new Headers({ "x-forwarded-for": address });

async function followedScreen(phones: number[]) {
  const { workspaceId } = await createUserWithWorkspace();
  const screen = await createScreen(workspaceId);
  for (const n of phones) await registerDevice(screen.token, phone(n), from(`198.51.100.${n}`));
  return { workspaceId, ...screen };
}

async function installationsOf(screenId: string) {
  const devices = (await screenDevices([screenId])).get(screenId) ?? [];
  return devices.map(({ installationId }) => Number(installationId.slice(-12)));
}

describe("phones following a screen", () => {
  beforeEach(resetDatabase);

  it(`are ${MAX_DEVICES_PER_SCREEN} at most, the one opened the longest ago giving way`, async () => {
    const phones = Array.from({ length: MAX_DEVICES_PER_SCREEN }, (_, index) => index + 1);
    const { id, token } = await followedScreen(phones);
    // The first phone opens the app again: the second one is now the stalest.
    await registerDevice(token, phone(1), from("198.51.100.1"));

    await registerDevice(token, phone(99), from("198.51.100.99"));

    const installations = await installationsOf(id);
    expect(installations).toHaveLength(MAX_DEVICES_PER_SCREEN);
    expect(installations).toContain(1);
    expect(installations).not.toContain(2);
    expect(installations).toContain(99);
  });

  it("can only be registered so often from one address", async () => {
    const { token } = await followedScreen([]);
    const office = from("203.0.113.9");
    for (let launch = 0; launch < 30; launch += 1) {
      expect(await registerDevice(token, phone(launch), office)).toBe("registered");
    }
    expect(await registerDevice(token, phone(31), office)).toBe("too-many-registrations");
    expect(await registerDevice(token, phone(31), from("203.0.113.10"))).toBe("registered");
  });

  it("replace the installation an app had before it was reinstalled", async () => {
    const { id, token } = await followedScreen([1]);

    // A new installation id, the phone's same Expo token.
    await registerDevice(token, phone(2, { pushToken: phone(1).pushToken }), from("198.51.100.2"));

    expect(await installationsOf(id)).toEqual([2]);
  });

  it("are forgotten with the screen's link, and when its password changes", async () => {
    const regenerated = await followedScreen([1, 2]);
    await regenerateScreenToken(regenerated.workspaceId, regenerated.id);
    expect(await installationsOf(regenerated.id)).toEqual([]);

    const locked = await followedScreen([3]);
    await setScreenPassword(locked.workspaceId, locked.id, "4321");
    expect(await installationsOf(locked.id)).toEqual([]);
    expect(await registerDevice(locked.token, phone(3), new Headers())).toBe("locked");

    // Removing a password locks no one out.
    const open = await followedScreen([4]);
    await setScreenPassword(open.workspaceId, open.id, null);
    expect(await installationsOf(open.id)).toEqual([4]);
  });

  it("lose the tokens that no longer reach them, and are forgotten with the last", async () => {
    const IOS_TOKEN = "ab".repeat(32);
    const both = phone(1, { deviceToken: IOS_TOKEN });
    const nativeOnly = phone(2, { pushToken: undefined, deviceToken: "cd".repeat(32) });
    const { workspaceId } = await createUserWithWorkspace();
    const first = await createScreen(workspaceId);
    const second = await createScreen(workspaceId);
    for (const screen of [first, second]) {
      await registerDevice(screen.token, both, from("198.51.100.1"));
      await registerDevice(screen.token, nativeOnly, from("198.51.100.2"));
    }

    await forgetTokens({ deviceTokens: [IOS_TOKEN, "cd".repeat(32)] });

    const rows = await db()
      .select({ pushToken: pushDevices.pushToken, deviceToken: pushDevices.deviceToken })
      .from(pushDevices);
    // On every screen, the first phone keeps its Expo token; the second had nothing else.
    expect(rows).toEqual([
      { pushToken: both.pushToken, deviceToken: null },
      { pushToken: both.pushToken, deviceToken: null },
    ]);

    await forgetTokens({ pushTokens: [both.pushToken ?? ""] });
    expect(await db().select().from(pushDevices)).toEqual([]);
  });
});

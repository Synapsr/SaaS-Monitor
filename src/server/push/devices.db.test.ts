import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { pushDevices } from "@/db/schema";
import { regenerateScreenToken, setScreenPassword } from "@/server/screens";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import {
  forgetPushTokens,
  MAX_DEVICES_PER_SCREEN,
  registerDevice,
  screenDevices,
  type DeviceRegistration,
} from "./devices";

const phone = (n: number): DeviceRegistration => ({
  pushToken: `ExponentPushToken[phone-${n}]`,
  platform: n % 2 ? "ios" : "android",
});

/** Each phone from its own address, unless told otherwise. */
const from = (address: string) => new Headers({ "x-forwarded-for": address });

async function followedScreen(phones: number[]) {
  const { workspaceId } = await createUserWithWorkspace();
  const screen = await createScreen(workspaceId);
  for (const n of phones) await registerDevice(screen.token, phone(n), from(`198.51.100.${n}`));
  return { workspaceId, ...screen };
}

async function tokensOf(screenId: string) {
  return (await screenDevices([screenId])).get(screenId) ?? [];
}

describe("phones following a screen", () => {
  beforeEach(resetDatabase);

  it(`are ${MAX_DEVICES_PER_SCREEN} at most, the one opened the longest ago giving way`, async () => {
    const phones = Array.from({ length: MAX_DEVICES_PER_SCREEN }, (_, index) => index + 1);
    const { id, token } = await followedScreen(phones);
    // The first phone opens the app again: the second one is now the stalest.
    await registerDevice(token, phone(1), from("198.51.100.1"));

    await registerDevice(token, phone(99), from("198.51.100.99"));

    const tokens = await tokensOf(id);
    expect(tokens).toHaveLength(MAX_DEVICES_PER_SCREEN);
    expect(tokens).toContain(phone(1).pushToken);
    expect(tokens).not.toContain(phone(2).pushToken);
    expect(tokens).toContain(phone(99).pushToken);
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

  it("are forgotten with the screen's link, and when its password changes", async () => {
    const regenerated = await followedScreen([1, 2]);
    await regenerateScreenToken(regenerated.workspaceId, regenerated.id);
    expect(await tokensOf(regenerated.id)).toEqual([]);

    const locked = await followedScreen([3]);
    await setScreenPassword(locked.workspaceId, locked.id, "4321");
    expect(await tokensOf(locked.id)).toEqual([]);
    expect(await registerDevice(locked.token, phone(3), new Headers())).toBe("locked");

    // Removing a password locks no one out.
    const open = await followedScreen([4]);
    await setScreenPassword(open.workspaceId, open.id, null);
    expect(await tokensOf(open.id)).toEqual([phone(4).pushToken]);
  });

  it("are forgotten on every screen once their app is gone", async () => {
    const first = await followedScreen([1, 2]);
    const second = await followedScreen([1]);

    await forgetPushTokens([phone(1).pushToken]);

    expect(await tokensOf(first.id)).toEqual([phone(2).pushToken]);
    expect(await tokensOf(second.id)).toEqual([]);
    expect(await db().select().from(pushDevices)).toHaveLength(1);
  });
});

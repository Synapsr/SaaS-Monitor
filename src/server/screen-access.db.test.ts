import { beforeEach, describe, expect, it } from "vitest";
import { signUp } from "@/test/auth";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import {
  canViewScreen,
  findScreenLock,
  unlockScreen,
  type AccessCookie,
  type ScreenLock,
} from "./screen-access";
import { setScreenPassword } from "./screens";

const device = new Headers({ "x-forwarded-for": "203.0.113.7" });

/** The headers of a device that kept the cookie of an unlocked screen. */
function withCookie(cookie: AccessCookie | null): Headers {
  if (!cookie) throw new Error("No cookie was set.");
  return new Headers({ cookie: `${cookie.name}=${encodeURIComponent(cookie.value)}` });
}

async function protectedScreen(password = "4321") {
  const { workspaceId } = await createUserWithWorkspace();
  const screen = await createScreen(workspaceId, { settings: { language: "fr", theme: "light" } });
  await setScreenPassword(workspaceId, screen.id, password);
  return { workspaceId, ...screen };
}

async function lockOf(token: string): Promise<ScreenLock> {
  const lock = await findScreenLock(token);
  if (!lock) throw new Error("No such screen.");
  return lock;
}

describe("screen access", () => {
  beforeEach(resetDatabase);

  it("lets anyone with the link see a screen without a password", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { token } = await createScreen(workspaceId);
    const lock = await lockOf(token);
    expect(lock.passwordHash).toBeNull();
    expect(await canViewScreen(lock, new Headers())).toBe(true);
    expect(await findScreenLock("unknown")).toBeNull();
  });

  it("asks for the password in the screen's language and theme, never keeping it in clear", async () => {
    const { token } = await protectedScreen("4321");
    const lock = await lockOf(token);
    expect(lock).toMatchObject({ language: "fr", theme: "light", accent: "emerald" });
    expect(lock.passwordHash).not.toContain("4321");
    expect(await canViewScreen(lock, new Headers())).toBe(false);
  });

  it("opens the screen on the device that typed the password, from then on", async () => {
    const { token } = await protectedScreen("4321");

    expect(await unlockScreen(token, "1234", device)).toEqual({ outcome: "wrong-password" });
    const unlocked = await unlockScreen(token, "4321", device);
    if (unlocked.outcome !== "unlocked") throw new Error(unlocked.outcome);

    expect(unlocked.cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(await canViewScreen(await lockOf(token), withCookie(unlocked.cookie))).toBe(true);
  });

  it("locks every device out again when the password changes", async () => {
    const { workspaceId, id, token } = await protectedScreen("4321");
    const unlocked = await unlockScreen(token, "4321", device);
    if (unlocked.outcome !== "unlocked") throw new Error(unlocked.outcome);

    await setScreenPassword(workspaceId, id, "8765");

    expect(await canViewScreen(await lockOf(token), withCookie(unlocked.cookie))).toBe(false);
  });

  it("does not accept the cookie of another screen", async () => {
    const first = await protectedScreen("4321");
    const second = await protectedScreen("4321");
    const unlocked = await unlockScreen(first.token, "4321", device);
    if (unlocked.outcome !== "unlocked" || !unlocked.cookie) throw new Error("Not unlocked.");
    const forged = { ...unlocked.cookie, name: `screen-access-${second.id}` };

    expect(await canViewScreen(await lockOf(second.token), withCookie(forged))).toBe(false);
  });

  it("lets the members of the screen's workspace in without the password", async () => {
    const { requestHeaders, personalWorkspaceId } = await signUp("Grace");
    const { id, token } = await createScreen(personalWorkspaceId);
    await setScreenPassword(personalWorkspaceId, id, "4321");
    const outsider = await signUp("Mallory");

    const lock = await lockOf(token);
    expect(await canViewScreen(lock, requestHeaders)).toBe(true);
    expect(await canViewScreen(lock, outsider.requestHeaders)).toBe(false);
  });

  it("stops answering after too many attempts from the same address", async () => {
    const { token } = await protectedScreen("4321");
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await unlockScreen(token, "0000", device)).outcome).toBe("wrong-password");
    }
    expect((await unlockScreen(token, "4321", device)).outcome).toBe("too-many-attempts");
    // Another device is not held back.
    const other = new Headers({ "x-forwarded-for": "198.51.100.4" });
    expect((await unlockScreen(token, "4321", other)).outcome).toBe("unlocked");
  });

  it("has nothing to unlock once the password is removed, or the screen is gone", async () => {
    const { workspaceId, id, token } = await protectedScreen();
    await setScreenPassword(workspaceId, id, null);
    expect(await unlockScreen(token, "anything", device)).toEqual({
      outcome: "unlocked",
      cookie: null,
    });
    expect(await unlockScreen("unknown", "anything", device)).toEqual({ outcome: "gone" });
  });
});

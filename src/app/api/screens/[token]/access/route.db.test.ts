import { beforeEach, describe, expect, it } from "vitest";
import { canViewScreen, findScreenLock } from "@/server/screen-access";
import { setScreenPassword } from "@/server/screens";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import { POST } from "./route";

const unlock = (token: string, body: unknown, address = "203.0.113.7") =>
  POST(
    new Request(`http://localhost/api/screens/${token}/access`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": address },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ token }) },
  );

async function protectedScreen(password = "4321") {
  const { workspaceId } = await createUserWithWorkspace();
  const screen = await createScreen(workspaceId);
  await setScreenPassword(workspaceId, screen.id, password);
  return { workspaceId, ...screen };
}

describe("screen access endpoint", () => {
  beforeEach(resetDatabase);

  it("trades the password for a proof that opens the screen in a header", async () => {
    const { token } = await protectedScreen("4321");

    const response = await unlock(token, { password: "4321" });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const { proof } = (await response.json()) as { proof: string };
    expect(proof).toEqual(expect.any(String));
    const lock = await findScreenLock(token);
    if (!lock) throw new Error("No such screen.");
    expect(await canViewScreen(lock, new Headers({ "x-screen-access": proof }))).toBe(true);
  });

  it("answers 401 to a wrong password, and 429 after too many attempts", async () => {
    const { token } = await protectedScreen("4321");

    const wrong = await unlock(token, { password: "0000" });
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: "wrong-password" });

    for (let attempt = 1; attempt < 10; attempt += 1) await unlock(token, { password: "0000" });
    const blocked = await unlock(token, { password: "4321" });
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: "too-many-attempts" });
  });

  it("has no proof to give for a screen without a password", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { token } = await createScreen(workspaceId);

    const response = await unlock(token, { password: "anything" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ proof: null });
  });

  it("opens the demo screen, which has no password", async () => {
    const response = await unlock("demo", { password: "anything" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ proof: null });
    expect((await unlock("demo", {})).status).toBe(400);
  });

  it("answers 404 for an unknown screen, and 400 without a password", async () => {
    expect((await unlock("unknown-token", { password: "4321" })).status).toBe(404);
    const { token } = await protectedScreen();
    expect((await unlock(token, {})).status).toBe(400);
    expect((await unlock(token, { password: "" })).status).toBe(400);
  });
});

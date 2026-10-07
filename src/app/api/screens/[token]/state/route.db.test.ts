import { after } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DisplayState } from "@/lib/display/types";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import { createStripeAccount } from "@/test/stripe-accounts";
import { unlockScreen } from "@/server/screen-access";
import { setScreenPassword } from "@/server/screens";
import { GET } from "./route";

vi.mock("next/server", () => ({ after: vi.fn() }));

const poll = (token: string) =>
  GET(new Request(`http://localhost/api/screens/${token}/state`), {
    params: Promise.resolve({ token }),
  });

describe("display polling endpoint", () => {
  beforeEach(async () => {
    vi.mocked(after).mockClear();
    await resetDatabase();
  });

  it("returns the display state, never cached, and syncs the screen's accounts afterwards", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const account = await createStripeAccount(workspaceId);
    const { token } = await createScreen(workspaceId, { accountIds: [account.id] });

    const response = await poll(token);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const state = (await response.json()) as DisplayState;
    expect(state).toMatchObject({ status: "importing", accounts: [{ id: account.id }] });
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("shares one computation between polls of the same screen a few seconds apart", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const account = await createStripeAccount(workspaceId);
    const { token } = await createScreen(workspaceId, { accountIds: [account.id] });

    const [first, second] = await Promise.all([poll(token), poll(token)]);

    expect(await second.json()).toEqual(await first.json());
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("answers 401 without the password of a protected screen, and the state with it", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { id, token } = await createScreen(workspaceId);
    await setScreenPassword(workspaceId, id, "4321");

    const locked = await poll(token);
    expect(locked.status).toBe(401);
    expect(await locked.json()).not.toHaveProperty("metrics");

    const unlocked = await unlockScreen(token, "4321", new Headers());
    if (unlocked.outcome !== "unlocked" || !unlocked.cookie) throw new Error("Not unlocked.");
    const { name, value } = unlocked.cookie;
    const response = await GET(
      new Request(`http://localhost/api/screens/${token}/state`, {
        headers: { cookie: `${name}=${value}` },
      }),
      { params: Promise.resolve({ token }) },
    );
    expect(response.status).toBe(200);
  });

  it("opens a protected screen to the app, which sends the proof of its password in a header", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const { id, token } = await createScreen(workspaceId);
    await setScreenPassword(workspaceId, id, "4321");
    const unlocked = await unlockScreen(token, "4321", new Headers());
    if (unlocked.outcome !== "unlocked" || !unlocked.cookie) throw new Error("Not unlocked.");

    const withHeader = (proof: string) =>
      GET(
        new Request(`http://localhost/api/screens/${token}/state`, {
          headers: { "x-screen-access": proof },
        }),
        { params: Promise.resolve({ token }) },
      );

    expect((await withHeader(unlocked.cookie.value)).status).toBe(200);
    expect((await withHeader("forged")).status).toBe(401);
  });

  it("serves the demo screen from its simulation, without a database row", async () => {
    const response = await poll("demo");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const state = (await response.json()) as DisplayState;
    expect(state).toMatchObject({
      status: "ready",
      currency: "usd",
      screen: { name: "Acme Analytics", settings: { language: "en", goal: 15_000 } },
      accounts: [{ id: "demo", name: "Acme Analytics" }],
      personalizedVoice: false,
    });
    expect(state.feed.length).toBeGreaterThan(0);
    expect(after).not.toHaveBeenCalled();
  });

  it("serves the variants of the demo's page", async () => {
    const response = await GET(new Request("http://localhost/api/screens/demo/state?lang=fr"), {
      params: Promise.resolve({ token: "demo" }),
    });

    const state = (await response.json()) as DisplayState;
    expect(state.screen.settings.language).toBe("fr");
  });

  it("answers 404 for an unknown screen", async () => {
    const response = await poll("unknown-token");

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(after).not.toHaveBeenCalled();
  });
});

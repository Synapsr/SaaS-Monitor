import { after } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DisplayState } from "@/lib/display/types";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import { createStripeAccount } from "@/test/stripe-accounts";
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

  it("answers 404 for an unknown screen", async () => {
    const response = await poll("unknown-token");

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(after).not.toHaveBeenCalled();
  });
});

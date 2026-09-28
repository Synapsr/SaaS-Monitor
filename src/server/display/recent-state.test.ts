import { describe, expect, it, vi } from "vitest";
import { getRecentDisplayState } from "./recent-state";
import { getDisplayStateByToken } from "./state";

vi.mock("./state", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./state")>()),
  getDisplayStateByToken: vi.fn(async () => null),
}));

describe("recent display states", () => {
  it("neither look up nor keep tokens that no screen can have", async () => {
    expect(await getRecentDisplayState("x".repeat(300)).state).toBeNull();
    expect(getDisplayStateByToken).not.toHaveBeenCalled();

    // A plausible token is looked up, and kept for a few seconds.
    await getRecentDisplayState("unknown-token").state;
    expect(getDisplayStateByToken).toHaveBeenCalledWith("unknown-token");
  });
});

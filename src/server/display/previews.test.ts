import { describe, expect, it, vi } from "vitest";
import { displayState } from "@/test/display";
import { loadDisplayStates } from "./previews";
import { getRecentDisplayState } from "./recent-state";

vi.mock("./recent-state", () => ({
  getRecentDisplayState: vi.fn((token: string) => ({
    state:
      token === "broken"
        ? Promise.reject(new Error("Database unreachable"))
        : Promise.resolve(displayState()),
    computed: true,
  })),
}));

const account = { id: "a1", name: "Acme", livemode: true };

describe("display states of the dashboard's previews", () => {
  it("load the screens that show accounts, side by side", async () => {
    const states = loadDisplayStates([
      { id: "office", publicToken: "office-token", accounts: [account] },
      { id: "lobby", publicToken: "lobby-token", accounts: [] },
    ]);

    // A screen without an account has nothing to show: it is not even looked up.
    expect([...states.keys()]).toEqual(["office"]);
    expect(getRecentDisplayState).toHaveBeenCalledTimes(1);
    expect(getRecentDisplayState).toHaveBeenCalledWith("office-token");
    expect(await states.get("office")).toMatchObject({ status: "ready" });
  });

  it("turn a state that fails into none, without failing the page", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const states = loadDisplayStates([{ id: "desk", publicToken: "broken", accounts: [account] }]);
    expect(await states.get("desk")).toBeNull();
  });
});

import { screensToRegister } from "@/notifications/devices";
import type { SavedScreen } from "@/screens/types";

jest.mock("expo-secure-store", () => ({}));

function screen(key: string, overrides: Partial<SavedScreen> = {}): SavedScreen {
  return {
    key,
    baseUrl: "https://saas-monitor.com",
    token: `token-${key}`,
    accessProof: null,
    name: key,
    alias: null,
    notify: true,
    appearance: null,
    addedAt: "2026-10-05T00:00:00.000Z",
    ...overrides,
  };
}

const keys = (screens: SavedScreen[]) => screens.map(({ key }) => key);

describe("screensToRegister", () => {
  it("registers the screens that notify", () => {
    const screens = [screen("a"), screen("b", { notify: false })];
    expect(keys(screensToRegister(screens, "token", new Map()))).toEqual(["a"]);
  });

  it("registers a screen once, until its proof or the push token changes", () => {
    const a = screen("a");
    const done = new Map([["a", JSON.stringify(["token", a.baseUrl, null])]]);
    expect(screensToRegister([a], "token", done)).toEqual([]);
    expect(keys(screensToRegister([a], "other token", done))).toEqual(["a"]);
    expect(keys(screensToRegister([{ ...a, accessProof: "proof" }], "token", done))).toEqual([
      "a",
    ]);
  });
});

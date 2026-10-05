import { registrationOf, screensToRegister } from "@/notifications/devices";
import type { SavedScreen } from "@/screens/types";

jest.mock("expo-secure-store", () => ({}));
jest.mock("expo-localization", () => ({ getLocales: () => [{ languageTag: "fr-FR" }] }));

function screen(key: string, overrides: Partial<SavedScreen> = {}): SavedScreen {
  return {
    key,
    baseUrl: "https://saas-monitor.com",
    token: `token-${key}`,
    accessProof: null,
    name: key,
    alias: null,
    notify: true,
    mutedEvents: [],
    appearance: null,
    addedAt: "2026-10-05T00:00:00.000Z",
    ...overrides,
  };
}

const device = {
  installationId: "6f1c2d3e-4b5a-4c6d-8e9f-0a1b2c3d4e5f",
  tokens: {
    pushToken: "ExponentPushToken[abc]",
    deviceToken: "a1b2c3",
    apnsEnvironment: "development" as const,
  },
  paused: false,
};

const keys = (screens: SavedScreen[]) => screens.map(({ key }) => key);

describe("registrationOf", () => {
  it("sends both tokens and the screen's choices", () => {
    expect(registrationOf(screen("a", { mutedEvents: ["customer"] }), device)).toEqual({
      installationId: device.installationId,
      platform: "ios",
      pushToken: "ExponentPushToken[abc]",
      deviceToken: "a1b2c3",
      apnsEnvironment: "development",
      locale: "fr-FR",
      enabled: true,
      mutedEvents: ["customer"],
    });
  });

  it("sends the tokens it has", () => {
    const registration = registrationOf(screen("a"), {
      ...device,
      tokens: { pushToken: null, deviceToken: "a1b2c3", apnsEnvironment: null },
    });
    expect(registration).not.toHaveProperty("pushToken");
    expect(registration).not.toHaveProperty("apnsEnvironment");
    expect(registration.deviceToken).toBe("a1b2c3");
  });

  it("silences a screen turned off, or every screen while paused", () => {
    expect(registrationOf(screen("a", { notify: false }), device).enabled).toBe(false);
    expect(registrationOf(screen("a"), { ...device, paused: true }).enabled).toBe(false);
  });
});

describe("screensToRegister", () => {
  it("registers every screen once, silenced ones included", () => {
    const screens = [screen("a"), screen("b", { notify: false })];
    expect(keys(screensToRegister(screens, device, new Map()))).toEqual(["a", "b"]);
  });

  it("registers a screen again when a token, its proof or a choice changes", () => {
    const a = screen("a");
    const done = new Map([["a", JSON.stringify([a.baseUrl, null, registrationOf(a, device)])]]);
    expect(screensToRegister([a], device, done)).toEqual([]);
    const rolled = { ...device, tokens: { ...device.tokens, deviceToken: "d4e5f6" } };
    expect(keys(screensToRegister([a], rolled, done))).toEqual(["a"]);
    expect(keys(screensToRegister([{ ...a, accessProof: "proof" }], device, done))).toEqual(["a"]);
    expect(keys(screensToRegister([{ ...a, mutedEvents: ["payment"] }], device, done))).toEqual([
      "a",
    ]);
    expect(keys(screensToRegister([a], { ...device, paused: true }, done))).toEqual(["a"]);
  });
});

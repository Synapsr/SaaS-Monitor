import {
  fetchScreenState,
  registerDevice,
  unlockScreen,
  unregisterDevice,
  type ScreenAccess,
} from "@/screens/api";
import { displayState } from "@/test/display";

const screen: ScreenAccess = {
  baseUrl: "https://acme.dev/monitor",
  token: "token_1",
  accessProof: "proof_1",
};

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

function respond(status: number, body?: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe("fetchScreenState", () => {
  it("reads the state of the screen, with the proof of its password", async () => {
    respond(200, displayState());
    const result = await fetchScreenState(screen);

    expect(result.kind).toBe("ok");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://acme.dev/monitor/api/screens/token_1/state");
    expect(init.headers).toMatchObject({ "x-screen-access": "proof_1" });
  });

  it("tells a locked screen from a gone one", async () => {
    respond(401, { error: "This screen asks for its password." });
    expect(await fetchScreenState(screen)).toEqual({ kind: "locked" });
    respond(404, { error: "This screen does not exist." });
    expect(await fetchScreenState(screen)).toEqual({ kind: "gone" });
  });

  it("fails on anything else, never with a wrong state", async () => {
    respond(502);
    expect(await fetchScreenState(screen)).toEqual({ kind: "failed" });
    respond(200, { hello: "captive portal" });
    expect(await fetchScreenState(screen)).toEqual({ kind: "failed" });
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    expect(await fetchScreenState(screen)).toEqual({ kind: "failed" });
  });

  it("sends no proof for a screen without a password", async () => {
    respond(200, displayState());
    await fetchScreenState({ ...screen, accessProof: null });
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("x-screen-access");
  });
});

describe("unlockScreen", () => {
  it("trades the password for a proof", async () => {
    respond(200, { proof: "proof_2" });
    expect(await unlockScreen(screen, "hunter2")).toEqual({ kind: "unlocked", proof: "proof_2" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://acme.dev/monitor/api/screens/token_1/access");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ password: "hunter2" });
  });

  it("says why it didn't", async () => {
    respond(401, { error: "wrong-password" });
    expect(await unlockScreen(screen, "nope")).toEqual({ kind: "wrong-password" });
    respond(429, { error: "too-many-attempts" });
    expect(await unlockScreen(screen, "nope")).toEqual({ kind: "too-many-attempts" });
    respond(404);
    expect(await unlockScreen(screen, "nope")).toEqual({ kind: "gone" });
    respond(200, {});
    expect(await unlockScreen(screen, "nope")).toEqual({ kind: "failed" });
  });
});

describe("devices", () => {
  const registration = {
    installationId: "6f1c2d3e-4b5a-4c6d-8e9f-0a1b2c3d4e5f",
    platform: "ios" as const,
    pushToken: "ExponentPushToken[abc]",
    deviceToken: "a1b2c3",
    apnsEnvironment: "development" as const,
    enabled: true,
    mutedEvents: ["customer" as const],
  };

  it("registers the device with its tokens and choices", async () => {
    respond(200, { ok: true });
    expect(await registerDevice(screen, { ...registration, locale: "fr-FR" })).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://acme.dev/monitor/api/screens/token_1/devices");
    expect(init.method).toBe("PUT");
    expect(init.headers).toMatchObject({ "x-screen-access": "proof_1" });
    expect(JSON.parse(String(init.body))).toEqual({ ...registration, locale: "fr-FR" });
  });

  it("unregisters it by its installation, a screen that is gone included", async () => {
    respond(204);
    expect(await unregisterDevice(screen, registration.installationId)).toBe(true);
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      installationId: registration.installationId,
    });
    respond(404);
    expect(await unregisterDevice(screen, registration.installationId)).toBe(true);
    respond(500);
    expect(await unregisterDevice(screen, registration.installationId)).toBe(false);
  });
});

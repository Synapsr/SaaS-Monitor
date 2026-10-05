import { generateKeyPairSync, verify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createFcmSender, fcmMessage, fcmResult, oauthAssertion, type FcmMessage } from "./fcm";
import type { Notice } from "./messages";
import { parseServiceAccount, type ServiceAccount } from "./service-account";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const account: ServiceAccount = {
  project_id: "saas-monitor",
  client_email: "push@saas-monitor.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  token_uri: "https://oauth2.googleapis.com/token",
};

const item: Notice = {
  key: "payment:1",
  screen: "0123456789abcdef",
  events: ["payment"],
  type: "moment",
  title: "Payment received",
  body: "$49 · Pro",
};

describe("service accounts", () => {
  it("are read from their JSON key, and nothing else", () => {
    // Firebase's keys carry more fields; Google's token endpoint is the default one.
    const { project_id, client_email, private_key } = account;
    const key = { type: "service_account", project_id, client_email, private_key };
    expect(parseServiceAccount(JSON.stringify(key))).toEqual(account);
    expect(parseServiceAccount("{")).toBeNull();
    expect(parseServiceAccount(JSON.stringify({ project_id: "x" }))).toBeNull();
  });
});

describe("FCM access", () => {
  it("is asked for with an RS256 assertion of the service account, for an hour", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    const [header, claims, signature] = oauthAssertion(account, now).split(".");
    const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString());

    expect(decode(header)).toEqual({ alg: "RS256", typ: "JWT" });
    const iat = now.getTime() / 1000;
    expect(decode(claims)).toEqual({
      iss: "push@saas-monitor.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp: iat + 3600,
    });
    expect(
      verify(
        "sha256",
        Buffer.from(`${header}.${claims}`),
        publicKey,
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true);
  });
});

describe("FCM messages", () => {
  it("go to the moments channel at high priority, with the app's data as strings", () => {
    expect(fcmMessage("fcm-token", item)).toEqual({
      message: {
        token: "fcm-token",
        notification: { title: "Payment received", body: "$49 · Pro" },
        data: { type: "moment", screen: "0123456789abcdef", event: "payment" },
        android: { priority: "HIGH", notification: { channel_id: "moments", sound: "default" } },
      },
    });
  });

  it("forget tokens Google says are unregistered, and only those", () => {
    const error = (status: string, errorCode?: string) => ({
      error: { status, details: errorCode ? [{ errorCode }] : [] },
    });
    expect(fcmResult(200, {})).toEqual({ status: "sent" });
    expect(fcmResult(404, error("NOT_FOUND", "UNREGISTERED"))).toEqual({ status: "unregistered" });
    expect(fcmResult(400, error("INVALID_ARGUMENT", "UNREGISTERED"))).toEqual({
      status: "unregistered",
    });
    expect(fcmResult(400, error("INVALID_ARGUMENT", "INVALID_ARGUMENT"))).toEqual({
      status: "failed",
      reason: "FCM 400 INVALID_ARGUMENT",
    });
    expect(fcmResult(503, null)).toEqual({ status: "failed", reason: "FCM 503" });
  });
});

describe("FCM sender", () => {
  /** Google, as tests see it: access tokens, and messages to tokens that may be gone. */
  function fakeGoogle() {
    const calls: { url: string; authorization: string | null; body: string }[] = [];
    let tokens = 0;
    const fetch: typeof globalThis.fetch = async (input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get("authorization");
      calls.push({ url, authorization, body: String(init?.body) });
      if (url === account.token_uri) {
        tokens += 1;
        return Response.json({ access_token: `ya29.token-${tokens}`, expires_in: 3600 });
      }
      const { message } = JSON.parse(String(init?.body)) as FcmMessage;
      return message.token === "gone"
        ? Response.json(
            { error: { status: "NOT_FOUND", details: [{ errorCode: "UNREGISTERED" }] } },
            { status: 404 },
          )
        : Response.json({ name: "projects/saas-monitor/messages/1" });
    };
    return { fetch, calls };
  }

  it("sends each message on its own, with one access token for all", async () => {
    const google = fakeGoogle();
    const send = createFcmSender(account, { fetch: google.fetch });

    const results = await Promise.all([
      send(fcmMessage("alive", item)),
      send(fcmMessage("gone", item)),
    ]);

    expect(results).toEqual([{ status: "sent" }, { status: "unregistered" }]);
    const sends = google.calls.filter(({ url }) => url.includes("messages:send"));
    expect(sends.map(({ url }) => url)).toEqual([
      "https://fcm.googleapis.com/v1/projects/saas-monitor/messages:send",
      "https://fcm.googleapis.com/v1/projects/saas-monitor/messages:send",
    ]);
    expect(sends.map(({ authorization }) => authorization)).toEqual([
      "Bearer ya29.token-1",
      "Bearer ya29.token-1",
    ]);
    const exchange = google.calls.find(({ url }) => url === account.token_uri);
    expect(new URLSearchParams(exchange?.body).get("grant_type")).toBe(
      "urn:ietf:params:oauth:grant-type:jwt-bearer",
    );
  });

  it("asks for a new access token once the previous one expires", async () => {
    const google = fakeGoogle();
    let now = new Date("2026-10-05T12:00:00Z");
    const send = createFcmSender(account, { fetch: google.fetch, now: () => now });

    await send(fcmMessage("alive", item));
    now = new Date(now.getTime() + 30 * 60_000);
    await send(fcmMessage("alive", item));
    now = new Date(now.getTime() + 30 * 60_000);
    await send(fcmMessage("alive", item));

    const authorizations = google.calls
      .filter(({ url }) => url.includes("messages:send"))
      .map(({ authorization }) => authorization);
    expect(authorizations).toEqual([
      "Bearer ya29.token-1",
      "Bearer ya29.token-1",
      "Bearer ya29.token-2",
    ]);
  });

  it("fails without throwing when Google cannot be reached", async () => {
    const send = createFcmSender(account, {
      fetch: async () => {
        throw new Error("Network down");
      },
    });
    expect(await send(fcmMessage("alive", item))).toEqual({
      status: "failed",
      reason: "Network down",
    });
  });
});

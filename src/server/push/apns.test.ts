import { generateKeyPairSync, verify, type KeyObject } from "node:crypto";
import { createServer, type Http2Server, type ServerHttp2Session } from "node:http2";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  apnsJwt,
  apnsPayload,
  apnsResult,
  createApnsSender,
  type ApnsCredentials,
  type ApnsPayload,
} from "./apns";
import type { Notice } from "./messages";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const credentials: ApnsCredentials = {
  keyId: "ABC123DEFG",
  teamId: "TEAM123456",
  privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  bundleId: "com.saasmonitor.app",
};

const item: Notice = {
  key: "payment:1",
  screen: "0123456789abcdef",
  events: ["payment"],
  title: "Payment received",
  body: "$49 · Pro",
};

function decode(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString()) as Record<string, unknown>;
}

function verifies(jwt: string, key: KeyObject): boolean {
  const [header, claims, signature] = jwt.split(".");
  return verify(
    "sha256",
    Buffer.from(`${header}.${claims}`),
    { key, dsaEncoding: "ieee-p1363" },
    Buffer.from(signature, "base64url"),
  );
}

describe("APNs provider tokens", () => {
  it("are ES256 JWTs naming the key and the team, signed with the key", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    const jwt = apnsJwt(credentials, privateKey, now);
    const [header, claims] = jwt.split(".");

    expect(decode(header)).toEqual({ alg: "ES256", kid: "ABC123DEFG" });
    expect(decode(claims)).toEqual({ iss: "TEAM123456", iat: now.getTime() / 1000 });
    expect(verifies(jwt, publicKey)).toBe(true);
  });
});

describe("APNs payloads", () => {
  it("alert time-sensitively, grouped by screen, with the app's data", () => {
    expect(apnsPayload(item)).toEqual({
      aps: {
        alert: { title: "Payment received", body: "$49 · Pro" },
        sound: "default",
        "interruption-level": "time-sensitive",
        "thread-id": "0123456789abcdef",
      },
      type: "moment",
      screen: "0123456789abcdef",
      event: "payment",
    });
  });
});

describe("APNs answers", () => {
  it("forget tokens Apple says are dead, and only those", () => {
    expect(apnsResult(200, "")).toEqual({ status: "sent" });
    expect(apnsResult(410, '{"reason":"Unregistered"}')).toEqual({ status: "unregistered" });
    expect(apnsResult(400, '{"reason":"BadDeviceToken"}')).toEqual({ status: "unregistered" });
    expect(apnsResult(403, '{"reason":"InvalidProviderToken"}')).toEqual({
      status: "failed",
      reason: "APNs 403 InvalidProviderToken",
    });
    expect(apnsResult(503, "Service Unavailable")).toEqual({
      status: "failed",
      reason: "APNs 503",
    });
  });
});

describe("APNs sender", () => {
  const received: { headers: Record<string, unknown>; payload: ApnsPayload }[] = [];
  const sessions: ServerHttp2Session[] = [];
  let server: Http2Server;
  let origin: string;

  beforeAll(async () => {
    // Apple's API, without TLS: HTTP/2 all the same.
    server = createServer();
    server.on("session", (session) => sessions.push(session));
    server.on("stream", (stream, headers) => {
      let body = "";
      stream.setEncoding("utf8");
      stream.on("data", (chunk: string) => (body += chunk));
      stream.on("end", () => {
        received.push({ headers, payload: JSON.parse(body) as ApnsPayload });
        const dead = String(headers[":path"]).endsWith("dead");
        stream.respond({ ":status": dead ? 410 : 200 });
        stream.end(dead ? JSON.stringify({ reason: "Unregistered" }) : "");
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => {
    for (const session of sessions) session.destroy();
    server.close();
  });

  it("posts each notification over one HTTP/2 connection, with a reused provider token", async () => {
    const send = createApnsSender(credentials, {
      hosts: { production: origin, development: origin },
    });
    const payload = apnsPayload(item);

    const results = await Promise.all([
      send({ deviceToken: "a1b2c3", environment: "production", payload }),
      send({ deviceToken: "dead", environment: "development", payload }),
    ]);

    expect(results).toEqual([{ status: "sent" }, { status: "unregistered" }]);
    expect(received[0].headers).toMatchObject({
      ":method": "POST",
      ":path": "/3/device/a1b2c3",
      "apns-push-type": "alert",
      "apns-topic": "com.saasmonitor.app",
      "apns-priority": "10",
    });
    expect(received[0].payload).toEqual(payload);
    const [first, second] = received.map(({ headers }) => String(headers.authorization));
    expect(first).toMatch(/^bearer /);
    expect(second).toBe(first);
    expect(verifies(first.slice("bearer ".length), publicKey)).toBe(true);
    expect(sessions).toHaveLength(1);
  });

  it("gives up on an unreachable Apple without throwing", async () => {
    const send = createApnsSender(credentials, {
      hosts: { production: "http://127.0.0.1:1", development: "http://127.0.0.1:1" },
    });
    const result = await send({
      deviceToken: "a1b2c3",
      environment: "production",
      payload: apnsPayload(item),
    });
    expect(result.status).toBe("failed");
  });
});

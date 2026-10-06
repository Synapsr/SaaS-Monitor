import "server-only";
import { createPrivateKey, type KeyObject } from "node:crypto";
import { connect, constants, type ClientHttp2Session } from "node:http2";
import type { APNS_ENVIRONMENTS } from "@/db/schema";
import { MINUTE_MS } from "@/lib/durations";
import { signJwt } from "./jwt";
import { pushData, type PushData, type Notice } from "./messages";
import { NATIVE_TIMEOUT_MS, type NativeResult } from "./native";

/*
 * Apple Push Notification service, with token-based authentication: the instance that publishes
 * the iOS app signs its requests with the app's APNs key. Requests go over HTTP/2, which Apple
 * requires, on connections kept open between syncs as Apple asks.
 * See https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns
 */

export type ApnsEnvironment = (typeof APNS_ENVIRONMENTS)[number];

export interface ApnsCredentials {
  keyId: string;
  teamId: string;
  /** The `.p8` key, in PEM. */
  privateKey: string;
  /** The app's bundle id, the topic of its notifications. */
  bundleId: string;
}

export const APNS_HOSTS: Record<ApnsEnvironment, string> = {
  production: "https://api.push.apple.com",
  development: "https://api.sandbox.push.apple.com",
};

/** Apple takes a provider token for an hour, and refuses new ones every few minutes. */
const TOKEN_LIFETIME_MS = 50 * MINUTE_MS;
/** An idle connection is closed after a while; the next notification opens another. */
const IDLE_MS = 10 * MINUTE_MS;

/** Reasons that say the token will never reach the app again. */
const DEAD_TOKEN_REASONS = new Set(["BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"]);

/** The provider token that authenticates requests (ES256, signed with the APNs key). */
export function apnsJwt(
  { keyId, teamId }: Pick<ApnsCredentials, "keyId" | "teamId">,
  key: KeyObject,
  now: Date,
): string {
  return signJwt(
    "ES256",
    { kid: keyId },
    { iss: teamId, iat: Math.floor(now.getTime() / 1000) },
    key,
  );
}

export interface ApnsPayload extends Omit<PushData, "audio"> {
  /**
   * The app's data where expo-notifications reads it on iOS, as Expo's own pushes carry it: the
   * moment's `audio` only there, where the app's notification service extension reads it too.
   */
  body: PushData;
  aps: {
    alert: { title: string; body: string };
    sound: "default";
    /** News of the business break through Focus modes. */
    "interruption-level": "time-sensitive";
    /** Notifications of a screen are grouped together. */
    "thread-id": string;
    /** The app's extension may play the moment's sound and voice instead of the default sound. */
    "mutable-content"?: 1;
  };
}

export function apnsPayload(item: Notice): ApnsPayload {
  const { audio, ...data } = pushData(item);
  return {
    aps: {
      alert: { title: item.title, body: item.body },
      sound: "default",
      "interruption-level": "time-sensitive",
      "thread-id": item.screen,
      ...(audio && { "mutable-content": 1 }),
    },
    body: pushData(item),
    ...data,
  };
}

export interface ApnsNotification {
  deviceToken: string;
  environment: ApnsEnvironment;
  payload: ApnsPayload;
}

export type ApnsSender = (notification: ApnsNotification) => Promise<NativeResult>;

/** How Apple's answer reads: dead tokens are forgotten, anything else may go through Expo. */
export function apnsResult(status: number, body: string): NativeResult {
  if (status === 200) return { status: "sent" };
  let reason = "";
  try {
    reason = String((JSON.parse(body) as { reason?: unknown }).reason ?? "");
  } catch {
    // Not JSON: the status says enough.
  }
  if (status === 410 || DEAD_TOKEN_REASONS.has(reason)) return { status: "unregistered" };
  return { status: "failed", reason: `APNs ${status} ${reason}`.trim() };
}

export function createApnsSender(
  credentials: ApnsCredentials,
  {
    hosts = APNS_HOSTS,
    now = () => new Date(),
    timeoutMs = NATIVE_TIMEOUT_MS,
  }: {
    /** Apple's hosts; tests point them at a local server. */
    hosts?: Record<ApnsEnvironment, string>;
    now?: () => Date;
    timeoutMs?: number;
  } = {},
): ApnsSender {
  const key = createPrivateKey(credentials.privateKey);
  let token: { value: string; until: number } | null = null;
  const sessions = new Map<string, ClientHttp2Session>();

  function authorization(): string {
    const at = now();
    if (!token || at.getTime() >= token.until) {
      token = { value: apnsJwt(credentials, key, at), until: at.getTime() + TOKEN_LIFETIME_MS };
    }
    return `bearer ${token.value}`;
  }

  function session(origin: string): ClientHttp2Session {
    const open = sessions.get(origin);
    if (open && !open.closed && !open.destroyed) return open;
    const created = connect(origin);
    // Errors end the connection; the next request opens another.
    created.on("error", () => sessions.delete(origin));
    created.on("close", () => sessions.delete(origin));
    created.setTimeout(IDLE_MS, () => created.close());
    // An open connection never keeps the process alive.
    created.unref();
    sessions.set(origin, created);
    return created;
  }

  // Connections keep the process alive only while a request waits for its answer.
  const waiting = new WeakMap<ClientHttp2Session, number>();
  function hold(connection: ClientHttp2Session) {
    waiting.set(connection, (waiting.get(connection) ?? 0) + 1);
    connection.ref();
  }
  function release(connection: ClientHttp2Session) {
    const left = (waiting.get(connection) ?? 1) - 1;
    waiting.set(connection, left);
    if (left === 0 && !connection.destroyed) connection.unref();
  }

  function post(
    connection: ClientHttp2Session,
    { deviceToken, payload }: ApnsNotification,
  ): Promise<NativeResult> {
    return new Promise((resolve) => {
      const request = connection.request({
        ":method": "POST",
        ":path": `/3/device/${deviceToken}`,
        authorization: authorization(),
        "apns-push-type": "alert",
        "apns-topic": credentials.bundleId,
        "apns-priority": "10",
        "content-type": "application/json",
      });
      let status = 0;
      let body = "";
      request.setEncoding("utf8");
      request.on("response", (headers) => (status = Number(headers[":status"])));
      request.on("data", (chunk: string) => (body += chunk));
      request.on("end", () => resolve(apnsResult(status, body)));
      request.on("error", (error) => resolve({ status: "failed", reason: error.message }));
      request.setTimeout(timeoutMs, () => {
        request.close(constants.NGHTTP2_CANCEL);
        resolve({ status: "failed", reason: "APNs did not answer in time." });
      });
      request.end(JSON.stringify(payload));
    });
  }

  return async (notification) => {
    try {
      const connection = session(hosts[notification.environment]);
      hold(connection);
      try {
        return await post(connection, notification);
      } finally {
        release(connection);
      }
    } catch (error) {
      return { status: "failed", reason: error instanceof Error ? error.message : "APNs" };
    }
  };
}

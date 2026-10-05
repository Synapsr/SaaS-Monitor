import "server-only";
import { createPrivateKey } from "node:crypto";
import { z } from "zod";
import { MINUTE_MS } from "@/lib/durations";
import { signJwt } from "./jwt";
import { pushData, type Notice } from "./messages";
import { NATIVE_TIMEOUT_MS, type NativeResult } from "./native";
import type { ServiceAccount } from "./service-account";

/*
 * Firebase Cloud Messaging (HTTP v1), for the Android app: the instance that publishes it sends
 * with the app's Firebase service account, which it trades for short-lived access tokens.
 * See https://firebase.google.com/docs/cloud-messaging/send-message
 */

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
/** Google's access tokens last an hour: one is renewed a little before it expires. */
const RENEW_BEFORE_MS = MINUTE_MS;

/** The assertion a service account trades for an access token (RS256, signed with its key). */
export function oauthAssertion(account: ServiceAccount, now: Date): string {
  const iat = Math.floor(now.getTime() / 1000);
  return signJwt(
    "RS256",
    { typ: "JWT" },
    { iss: account.client_email, scope: SCOPE, aud: account.token_uri, iat, exp: iat + 3600 },
    createPrivateKey(account.private_key),
  );
}

export interface FcmMessage {
  message: {
    token: string;
    notification: { title: string; body: string };
    /** FCM only carries strings. */
    data: Record<string, string>;
    android: {
      /** Delivered at once, rather than when Android sees fit. */
      priority: "HIGH";
      notification: { channel_id: "moments"; sound: "default" };
    };
  };
}

export function fcmMessage(token: string, item: Notice): FcmMessage {
  const { type, screen, event } = pushData(item);
  return {
    message: {
      token,
      notification: { title: item.title, body: item.body },
      data: { type, screen, event },
      android: { priority: "HIGH", notification: { channel_id: "moments", sound: "default" } },
    },
  };
}

export type FcmSender = (message: FcmMessage) => Promise<NativeResult>;

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});

const errorSchema = z.object({
  error: z.object({
    status: z.string().optional(),
    details: z.array(z.object({ errorCode: z.string().optional() }).loose()).optional(),
  }),
});

/** How Google's answer reads: dead tokens are forgotten, anything else may go through Expo. */
export function fcmResult(status: number, body: unknown): NativeResult {
  if (status === 200) return { status: "sent" };
  const error = errorSchema.safeParse(body).data?.error;
  const code = error?.details?.find((detail) => detail.errorCode)?.errorCode ?? error?.status;
  if (status === 404 || code === "UNREGISTERED") return { status: "unregistered" };
  return { status: "failed", reason: `FCM ${status} ${code ?? ""}`.trim() };
}

export function createFcmSender(
  account: ServiceAccount,
  {
    fetch = globalThis.fetch,
    now = () => new Date(),
    timeoutMs = NATIVE_TIMEOUT_MS,
  }: { fetch?: typeof globalThis.fetch; now?: () => Date; timeoutMs?: number } = {},
): FcmSender {
  const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`;
  // Shared by the notifications sent at the same time: one token request for all of them.
  let accessToken: Promise<{ value: string; until: number }> | null = null;

  async function requestAccessToken() {
    const at = now();
    const response = await fetch(account.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: oauthAssertion(account, at),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`Google answered ${response.status} for an access token.`);
    const { access_token, expires_in } = tokenResponseSchema.parse(await response.json());
    return { value: access_token, until: at.getTime() + expires_in * 1000 - RENEW_BEFORE_MS };
  }

  async function authorization(): Promise<string> {
    const current = accessToken && (await accessToken.catch(() => null));
    if (current && now().getTime() < current.until) return `Bearer ${current.value}`;
    accessToken = requestAccessToken();
    // A failed request is not kept: the next notification asks again.
    accessToken.catch(() => (accessToken = null));
    return `Bearer ${(await accessToken).value}`;
  }

  return async (message) => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: await authorization(), "Content-Type": "application/json" },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(timeoutMs),
      });
      // A token Google no longer takes is asked again next time.
      if (response.status === 401) accessToken = null;
      return fcmResult(response.status, await response.json().catch(() => null));
    } catch (error) {
      return { status: "failed", reason: error instanceof Error ? error.message : "FCM" };
    }
  };
}

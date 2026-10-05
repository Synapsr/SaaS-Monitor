import type { ScreenEvent } from "@/contract/display/events";
import type { DisplayState } from "@/contract/display/types";
import type { ScreenLink } from "@/screens/link";
import { readDisplayState } from "@/screens/state";

/*
 * The server API (v1) of a screen's instance, as AGENTS.md describes it. Every call goes to the
 * instance of the screen: the app has no server of its own.
 */

/** A screen's link, and the proof of its password when it has one. */
export interface ScreenAccess extends ScreenLink {
  accessProof: string | null;
}

export type StateResult =
  | { kind: "ok"; state: DisplayState }
  /** It asks for its password, or a new one: the proof no longer opens it. */
  | { kind: "locked" }
  /** The link no longer works: the screen was deleted, or its link regenerated. */
  | { kind: "gone" }
  /** The instance can't be reached, or answered something else. */
  | { kind: "failed" };

export type UnlockResult =
  | { kind: "unlocked"; proof: string }
  | { kind: "wrong-password" }
  | { kind: "too-many-attempts" }
  | { kind: "gone" }
  | { kind: "failed" };

/**
 * What a device tells a screen's instance (`PUT …/devices`): its tokens, at least one, and its
 * choices for the screen.
 */
export interface DeviceRegistration {
  /** Generated once by the app: names this device on every instance. */
  installationId: string;
  platform: "ios" | "android";
  /** Expo's push token, `ExponentPushToken[…]`. */
  pushToken?: string;
  /** The native token: APNs on iOS, FCM on Android. */
  deviceToken?: string;
  /** Which APNs environment `deviceToken` belongs to, on iOS. */
  apnsEnvironment?: "development" | "production";
  /** BCP 47 tag of the device, e.g. `fr-FR`. Notifications speak the screen's language anyway. */
  locale?: string;
  /** "Notifications on this device", unless they are paused for every screen. */
  enabled: boolean;
  /** Events of the screen this device doesn't want. */
  mutedEvents: ScreenEvent[];
}

/** A display waits this long for an answer before trying again. */
const TIMEOUT_MS = 15_000;

function endpoint({ baseUrl, token }: ScreenLink, path: "state" | "access" | "devices"): string {
  return `${baseUrl}/api/screens/${encodeURIComponent(token)}/${path}`;
}

function headers(access: ScreenAccess | ScreenLink, body: boolean): Record<string, string> {
  const proof = "accessProof" in access ? access.accessProof : null;
  return {
    accept: "application/json",
    ...(body ? { "content-type": "application/json" } : {}),
    ...(proof ? { "x-screen-access": proof } : {}),
  };
}

/** `fetch`, given up after `TIMEOUT_MS`, or when `signal` aborts. */
async function send(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

async function json(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** `GET …/state`: what the screen shows right now. */
export async function fetchScreenState(
  access: ScreenAccess,
  options: { signal?: AbortSignal } = {},
): Promise<StateResult> {
  try {
    const response = await send(
      endpoint(access, "state"),
      { headers: headers(access, false) },
      options.signal,
    );
    if (response.status === 401) return { kind: "locked" };
    if (response.status === 404) return { kind: "gone" };
    if (!response.ok) return { kind: "failed" };
    const state = readDisplayState(await json(response));
    return state ? { kind: "ok", state } : { kind: "failed" };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return { kind: "failed" };
  }
}

/** `POST …/access`: trades the screen's password for a proof the app keeps. */
export async function unlockScreen(link: ScreenLink, password: string): Promise<UnlockResult> {
  try {
    const response = await send(endpoint(link, "access"), {
      method: "POST",
      headers: headers(link, true),
      body: JSON.stringify({ password }),
    });
    if (response.status === 401) return { kind: "wrong-password" };
    if (response.status === 429) return { kind: "too-many-attempts" };
    if (response.status === 404) return { kind: "gone" };
    const body = await json(response);
    const proof = (body as { proof?: unknown } | null)?.proof;
    return response.ok && typeof proof === "string" && proof.length > 0
      ? { kind: "unlocked", proof }
      : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

/** `PUT …/devices`: this device follows the screen, as it chose. Idempotent. */
export async function registerDevice(
  access: ScreenAccess,
  registration: DeviceRegistration,
): Promise<boolean> {
  try {
    const response = await send(endpoint(access, "devices"), {
      method: "PUT",
      headers: headers(access, true),
      body: JSON.stringify(registration),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * `DELETE …/devices`: this device no longer follows the screen. A screen that is gone has no
 * devices any more: that is done too.
 */
export async function unregisterDevice(access: ScreenAccess, installationId: string): Promise<boolean> {
  try {
    const response = await send(endpoint(access, "devices"), {
      method: "DELETE",
      headers: headers(access, true),
      body: JSON.stringify({ installationId }),
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

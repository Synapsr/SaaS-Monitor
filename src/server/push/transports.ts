import "server-only";
import { env } from "@/env";
import { apnsPayload, createApnsSender, type ApnsCredentials, type ApnsSender } from "./apns";
import {
  EXPO_BATCH_SIZE,
  expoMessage,
  expoSender,
  isUnregistered,
  type ExpoMessage,
  type ExpoSender,
} from "./expo";
import { createFcmSender, fcmMessage, type FcmSender } from "./fcm";
import { parseServiceAccount } from "./service-account";
import type { Delivery } from "./messages";
import type { NativeResult } from "./native";

/*
 * How notifications reach phones. The instance that publishes the app holds its Apple and Google
 * credentials, and reaches phones directly; every other instance goes through the Expo push
 * service, which needs none. A phone without a native token, or that its platform could not reach,
 * hears through Expo too, if it has an Expo token.
 */

export interface PushTransports {
  expo: ExpoSender;
  /** `null` without the instance's APNs key. */
  apns: ApnsSender | null;
  /** `null` without the instance's Firebase service account. */
  fcm: FcmSender | null;
}

/** Notifications sent to Apple and Google at the same time, at most. */
const NATIVE_CONCURRENCY = 8;

let configured: PushTransports | undefined;

/** The transports of this instance, kept for its life: connections and tokens are reused. */
export function defaultTransports(): PushTransports {
  if (configured) return configured;
  const { APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY, APNS_BUNDLE_ID, FCM_SERVICE_ACCOUNT } =
    env();
  const account = FCM_SERVICE_ACCOUNT ? parseServiceAccount(FCM_SERVICE_ACCOUNT) : null;
  configured = {
    expo: expoSender,
    apns:
      APNS_KEY_ID && APNS_TEAM_ID && APNS_PRIVATE_KEY
        ? apnsSender({
            keyId: APNS_KEY_ID,
            teamId: APNS_TEAM_ID,
            privateKey: APNS_PRIVATE_KEY,
            bundleId: APNS_BUNDLE_ID,
          })
        : null,
    fcm: account ? createFcmSender(account) : null,
  };
  return configured;
}

/**
 * Apple, with the instance's key. A key that can't be read turns off Apple alone: phones still get
 * what Expo can send them, and the log says what to fix.
 */
function apnsSender(credentials: ApnsCredentials): ApnsSender | null {
  try {
    return createApnsSender(credentials);
  } catch (error) {
    console.error(
      "[push] APNS_PRIVATE_KEY is not a readable .p8 key, nothing is sent to Apple directly:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export interface DeliveryReport {
  sent: number;
  /** Expo tokens Expo no longer reaches. */
  pushTokens: string[];
  /** Native tokens Apple or Google no longer reach. */
  deviceTokens: string[];
}

/** Sends each notification by the best way its phone can be reached. Never throws. */
export async function deliver(
  deliveries: readonly Delivery[],
  transports: PushTransports,
): Promise<DeliveryReport> {
  const report: DeliveryReport = { sent: 0, pushTokens: [], deviceTokens: [] };
  const viaExpo: ExpoMessage[] = [];
  const viaNative: { delivery: Delivery; send: () => Promise<NativeResult> }[] = [];

  for (const delivery of deliveries) {
    const send = nativeSend(delivery, transports);
    if (send) viaNative.push({ delivery, send });
    else if (delivery.device.pushToken) {
      viaExpo.push(expoMessage(delivery.device.pushToken, delivery.notice));
    }
  }

  const failures = new Set<string>();
  const results = await mapConcurrently(viaNative, NATIVE_CONCURRENCY, ({ send }) =>
    send().catch((error: unknown): NativeResult => ({
      status: "failed",
      reason: error instanceof Error ? error.message : String(error),
    })),
  );
  results.forEach((result, index) => {
    const { device, notice } = viaNative[index].delivery;
    if (result.status === "sent") report.sent += 1;
    else if (result.status === "unregistered" && device.deviceToken) {
      report.deviceTokens.push(device.deviceToken);
    }
    if (result.status === "failed") failures.add(result.reason);
    // Apple or Google refused it, or the phone's native token is gone: Expo may still reach it.
    if (result.status !== "sent" && device.pushToken) {
      viaExpo.push(expoMessage(device.pushToken, notice));
    }
  });
  if (failures.size)
    console.warn(`[push] Native notifications failed: ${[...failures].join("; ")}`);

  for (let start = 0; start < viaExpo.length; start += EXPO_BATCH_SIZE) {
    const batch = viaExpo.slice(start, start + EXPO_BATCH_SIZE);
    try {
      const tickets = await transports.expo(batch);
      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") report.sent += 1;
        else if (isUnregistered(ticket)) report.pushTokens.push(batch[index].to);
      });
    } catch (error) {
      // A batch Expo refuses does not keep the others from going.
      console.warn(
        `[push] ${batch.length} notifications could not be sent through Expo:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  return report;
}

/** How to send a notification straight to Apple or Google; `null` when that is not possible. */
function nativeSend(
  { device, notice }: Delivery,
  { apns, fcm }: PushTransports,
): (() => Promise<NativeResult>) | null {
  const { deviceToken, platform, apnsEnvironment } = device;
  if (!deviceToken) return null;
  if (platform === "ios" && apns) {
    const environment = apnsEnvironment ?? "production";
    return () => apns({ deviceToken, environment, payload: apnsPayload(notice) });
  }
  if (platform === "android" && fcm) return () => fcm(fcmMessage(deviceToken, notice));
  return null;
}

/** `task` of every item, `limit` at a time, in the items' order. */
async function mapConcurrently<Item, Result>(
  items: readonly Item[],
  limit: number,
  task: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

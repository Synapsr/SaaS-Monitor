import "server-only";
import { z } from "zod";
import type { ScreenEvent } from "@/lib/display/events";

/*
 * Notifications reach phones through the Expo push service, which forwards them to Apple and
 * Google. It needs no credentials from the instance: any instance, hosted or self-hosted, sends to
 * the phones of the SaaS Monitor app. See https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo takes up to 100 messages per request. */
export const EXPO_BATCH_SIZE = 100;
/** Pushes are best effort: a slow Expo never holds a sync for long. */
const EXPO_TIMEOUT_MS = 10_000;

/** What the app reads from a notification, to open the right screen and show the right icon. */
export interface MomentData {
  type: "moment";
  /** The first 16 hex characters of the SHA-256 of the screen's token (`screenKey`). */
  screen: string;
  event: ScreenEvent;
}

/** A message of Expo's push API. */
export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: MomentData;
  sound: "default";
  /** Delivered at once, rather than when Android sees fit. */
  priority: "high";
  /** The channel the app creates for moments, on Android. */
  channelId: "moments";
  /** News of the business break through Focus modes, on iOS. */
  interruptionLevel: "time-sensitive";
}

const ticketSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), id: z.string() }),
  z.object({
    status: z.literal("error"),
    message: z.string().optional(),
    details: z.object({ error: z.string().optional() }).loose().optional(),
  }),
]);

/** Expo's answer for one message: `DeviceNotRegistered` means the app is gone from the phone. */
export type PushTicket = z.infer<typeof ticketSchema>;

const responseSchema = z.object({ data: z.array(ticketSchema) });

/** Sends up to `EXPO_BATCH_SIZE` messages, and returns their tickets in the same order. */
export type PushSender = (messages: readonly PushMessage[]) => Promise<PushTicket[]>;

export const expoPushSender: PushSender = async (messages) => {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
    signal: AbortSignal.timeout(EXPO_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Expo answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const { data } = responseSchema.parse(await response.json());
  if (data.length !== messages.length) {
    throw new Error(`Expo answered ${data.length} tickets for ${messages.length} messages.`);
  }
  return data;
};

/** Whether a ticket says the phone no longer has the app: its token is worth forgetting. */
export function isUnregistered(ticket: PushTicket): boolean {
  return ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered";
}

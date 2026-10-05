import "server-only";
import { z } from "zod";
import { momentData, type MomentData, type Notice } from "./messages";

/*
 * The Expo push service forwards notifications to Apple and Google. It needs no credentials from
 * the instance: any instance, hosted or self-hosted, reaches the phones of the SaaS Monitor app
 * this way. See https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo takes up to 100 messages per request. */
export const EXPO_BATCH_SIZE = 100;
/** Pushes are best effort: a slow Expo never holds a sync for long. */
const EXPO_TIMEOUT_MS = 10_000;

/** A message of Expo's push API. */
export interface ExpoMessage {
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

export function expoMessage(to: string, item: Notice): ExpoMessage {
  return {
    to,
    title: item.title,
    body: item.body,
    data: momentData(item),
    sound: "default",
    priority: "high",
    channelId: "moments",
    interruptionLevel: "time-sensitive",
  };
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
export type ExpoTicket = z.infer<typeof ticketSchema>;

const responseSchema = z.object({ data: z.array(ticketSchema) });

/** Sends up to `EXPO_BATCH_SIZE` messages, and returns their tickets in the same order. */
export type ExpoSender = (messages: readonly ExpoMessage[]) => Promise<ExpoTicket[]>;

export const expoSender: ExpoSender = async (messages) => {
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
export function isUnregistered(ticket: ExpoTicket): boolean {
  return ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered";
}

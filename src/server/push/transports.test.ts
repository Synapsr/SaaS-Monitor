import { describe, expect, it } from "vitest";
import type { ApnsNotification } from "./apns";
import type { Device } from "./devices";
import type { ExpoMessage, ExpoTicket } from "./expo";
import type { FcmMessage } from "./fcm";
import type { Delivery } from "./messages";
import type { NativeResult } from "./native";
import { deliver, type PushTransports } from "./transports";

const IOS_TOKEN = "ab".repeat(32);

const device = (overrides: Partial<Device> = {}): Device => ({
  installationId: crypto.randomUUID(),
  platform: "ios",
  pushToken: null,
  deviceToken: null,
  apnsEnvironment: null,
  enabled: true,
  mutedEvents: [],
  ...overrides,
});

const delivery = (overrides: Partial<Device>): Delivery => ({
  device: device(overrides),
  notice: {
    key: "payment:1",
    screen: "0123456789abcdef",
    events: ["payment"],
    title: "Payment received",
    body: "$49",
  },
});

/** Apple, Google and Expo, answering as told and remembering what they were sent. */
function fakeTransports(
  answers: { apns?: NativeResult; fcm?: NativeResult; expo?: ExpoTicket } = {},
  { native = true } = {},
) {
  const sent = {
    apns: [] as ApnsNotification[],
    fcm: [] as FcmMessage[],
    expo: [] as ExpoMessage[],
  };
  const transports: PushTransports = {
    apns: native
      ? async (notification) => {
          sent.apns.push(notification);
          return answers.apns ?? { status: "sent" };
        }
      : null,
    fcm: native
      ? async (message) => {
          sent.fcm.push(message);
          return answers.fcm ?? { status: "sent" };
        }
      : null,
    expo: async (messages) => {
      sent.expo.push(...messages);
      return messages.map(() => answers.expo ?? { status: "ok", id: "ticket" });
    },
  };
  return { transports, sent };
}

describe("delivering notifications", () => {
  it("reaches phones straight through Apple and Google when the instance can", async () => {
    const { transports, sent } = fakeTransports();
    const report = await deliver(
      [
        delivery({
          deviceToken: IOS_TOKEN,
          apnsEnvironment: "development",
          pushToken: "ExponentPushToken[ios]",
        }),
        delivery({ platform: "android", deviceToken: "fcm-token" }),
      ],
      transports,
    );

    expect(report).toEqual({ sent: 2, pushTokens: [], deviceTokens: [] });
    expect(sent.apns).toEqual([
      expect.objectContaining({ deviceToken: IOS_TOKEN, environment: "development" }),
    ]);
    expect(sent.fcm).toEqual([
      expect.objectContaining({ message: expect.objectContaining({ token: "fcm-token" }) }),
    ]);
    expect(sent.expo).toEqual([]);
  });

  it("goes through Expo without the instance's credentials, or the phone's native token", async () => {
    const { transports, sent } = fakeTransports({}, { native: false });
    const report = await deliver(
      [
        delivery({ deviceToken: IOS_TOKEN, pushToken: "ExponentPushToken[ios]" }),
        delivery({ platform: "android", pushToken: "ExponentPushToken[android]" }),
        // Out of reach: nothing to send it with.
        delivery({ platform: "android", deviceToken: "fcm-token" }),
      ],
      transports,
    );

    expect(report.sent).toBe(2);
    expect(sent.expo.map(({ to }) => to)).toEqual([
      "ExponentPushToken[ios]",
      "ExponentPushToken[android]",
    ]);
  });

  it("forgets dead native tokens, and still tries Expo for the phone", async () => {
    const { transports, sent } = fakeTransports({ apns: { status: "unregistered" } });
    const report = await deliver(
      [delivery({ deviceToken: IOS_TOKEN, pushToken: "ExponentPushToken[ios]" })],
      transports,
    );

    expect(report).toEqual({ sent: 1, pushTokens: [], deviceTokens: [IOS_TOKEN] });
    expect(sent.expo.map(({ to }) => to)).toEqual(["ExponentPushToken[ios]"]);
  });

  it("falls back on Expo when Apple refuses, and forgets Expo tokens Expo no longer reaches", async () => {
    const { transports, sent } = fakeTransports({
      apns: { status: "failed", reason: "APNs 403 InvalidProviderToken" },
      expo: { status: "error", details: { error: "DeviceNotRegistered" } },
    });
    const report = await deliver(
      [delivery({ deviceToken: IOS_TOKEN, pushToken: "ExponentPushToken[ios]" })],
      transports,
    );

    expect(sent.expo).toHaveLength(1);
    expect(report).toEqual({ sent: 0, pushTokens: ["ExponentPushToken[ios]"], deviceTokens: [] });
  });

  it("never throws, whatever the transports do", async () => {
    const failing: PushTransports = {
      apns: async () => {
        throw new Error("Socket hang up");
      },
      fcm: null,
      expo: async () => {
        throw new Error("Expo is down");
      },
    };
    const report = await deliver(
      [delivery({ deviceToken: IOS_TOKEN, pushToken: "ExponentPushToken[ios]" })],
      failing,
    );
    expect(report).toEqual({ sent: 0, pushTokens: [], deviceTokens: [] });
  });
});

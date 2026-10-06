import { describe, expect, it } from "vitest";
import { expoMessage } from "./expo";
import type { Notice } from "./messages";

const item: Notice = {
  key: "payment:1",
  screen: "0123456789abcdef",
  events: ["payment"],
  type: "moment",
  title: "Payment received",
  body: "$49 · Pro",
};

describe("Expo messages", () => {
  it("alert time-sensitively on the moments channel, with the app's data", () => {
    expect(expoMessage("ExponentPushToken[a]", item)).toEqual({
      to: "ExponentPushToken[a]",
      title: "Payment received",
      body: "$49 · Pro",
      data: { type: "moment", screen: "0123456789abcdef", event: "payment" },
      sound: "default",
      priority: "high",
      channelId: "moments",
      interruptionLevel: "time-sensitive",
    });
  });

  it("let the app's extension play the moment's sound and voice", () => {
    const audio: NonNullable<Notice["audio"]> = {
      sound: null,
      voice: { id: "noa", phrase: "customer", volume: 1, delayMs: 0, announcement: null },
    };
    expect(expoMessage("ExponentPushToken[a]", { ...item, audio })).toMatchObject({
      data: { audio },
      mutableContent: true,
    });
  });
});

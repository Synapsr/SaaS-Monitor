import { describe, expect, it } from "vitest";
import { MAX_PUSHES_PER_PHONE, pushMessages, type Notice, type ScreenNotices } from "./messages";

const notice = (key: string, overrides: Partial<Notice> = {}): Notice => ({
  key,
  screen: "0123456789abcdef",
  event: "payment",
  title: "Payment received",
  body: key,
  ...overrides,
});

function screen(overrides: Partial<ScreenNotices> = {}): ScreenNotices {
  return {
    pushTokens: ["ExponentPushToken[phone]"],
    moments: [notice("payment:1")],
    summary: notice("summary", { title: "Catching up" }),
    milestones: [],
    ...overrides,
  };
}

describe("push messages", () => {
  it("address each notice to each phone, as Expo expects it", () => {
    const messages = pushMessages([
      screen({ pushTokens: ["ExponentPushToken[a]", "ExponentPushToken[b]"] }),
    ]);

    expect(messages).toEqual(
      ["ExponentPushToken[a]", "ExponentPushToken[b]"].map((to) => ({
        to,
        title: "Payment received",
        body: "payment:1",
        data: { type: "moment", screen: "0123456789abcdef", event: "payment" },
        sound: "default",
        priority: "high",
        channelId: "moments",
        interruptionLevel: "time-sensitive",
      })),
    );
  });

  it("tell a phone following two screens of the same account once", () => {
    const messages = pushMessages([
      screen({ moments: [notice("payment:1"), notice("movement:1")] }),
      screen({ moments: [notice("payment:1", { screen: "fedcba9876543210" })] }),
    ]);

    expect(messages.map((message) => message.body)).toEqual(["payment:1", "movement:1"]);
    expect(messages[0].data.screen).toBe("0123456789abcdef");
  });

  it("sum up a burst in a single notification per phone, milestones apart", () => {
    const burst = Array.from({ length: MAX_PUSHES_PER_PHONE + 1 }, (_, index) =>
      notice(`payment:${index}`),
    );
    const milestone = notice("milestone", { event: "milestone", title: "🎉 New milestone" });
    const messages = pushMessages([screen({ moments: burst, milestones: [milestone] })]);

    expect(messages.map((message) => message.title)).toEqual(["Catching up", "🎉 New milestone"]);
  });

  it("let a few moments through, one by one", () => {
    const few = Array.from({ length: MAX_PUSHES_PER_PHONE }, (_, index) =>
      notice(`payment:${index}`),
    );
    expect(pushMessages([screen({ moments: few })])).toHaveLength(MAX_PUSHES_PER_PHONE);
  });
});

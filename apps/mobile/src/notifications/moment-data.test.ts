import { notificationRequestScreen, notificationScreen } from "@/notifications/moment-data";

describe("notificationScreen", () => {
  it("reads the screen of a moment", () => {
    expect(
      notificationScreen({ type: "moment", screen: "0123456789abcdef", event: "payment" }),
    ).toBe("0123456789abcdef");
  });

  it("reads the screen of a test sent from the dashboard", () => {
    expect(
      notificationScreen({ type: "test", screen: "0123456789abcdef", event: "payment" }),
    ).toBe("0123456789abcdef");
  });

  it("ignores anything else", () => {
    for (const data of [
      null,
      "moment",
      {},
      { screen: "0123456789abcdef" },
      { type: "news", screen: "0123456789abcdef" },
      { type: "moment", screen: 42 },
      { type: "moment", screen: "not-a-key" },
    ]) {
      expect(notificationScreen(data)).toBeNull();
    }
  });
});

describe("notificationRequestScreen", () => {
  const moment = { type: "moment", screen: "0123456789abcdef", event: "payment" };

  it("reads notifications sent through Expo", () => {
    expect(notificationRequestScreen({ content: { data: moment } })).toBe("0123456789abcdef");
  });

  it("reads APNs payloads, with their data under `body` or at the top", () => {
    const trigger = (payload: object) => ({ type: "push", payload: { aps: {}, ...payload } });
    expect(notificationRequestScreen({ content: { data: null }, trigger: trigger({ body: moment }) })).toBe(
      "0123456789abcdef",
    );
    expect(notificationRequestScreen({ content: { data: null }, trigger: trigger(moment) })).toBe(
      "0123456789abcdef",
    );
  });

  it("reads FCM data messages", () => {
    expect(
      notificationRequestScreen({ content: { data: {} }, trigger: { type: "push", remoteMessage: { data: moment } } }),
    ).toBe("0123456789abcdef");
  });

  it("ignores other notifications", () => {
    expect(notificationRequestScreen({ content: { data: { type: "news" } }, trigger: null })).toBeNull();
  });
});

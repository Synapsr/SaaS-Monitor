import { notificationScreen } from "@/notifications/moment-data";

describe("notificationScreen", () => {
  it("reads the screen of a moment", () => {
    expect(
      notificationScreen({ type: "moment", screen: "0123456789abcdef", event: "payment" }),
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

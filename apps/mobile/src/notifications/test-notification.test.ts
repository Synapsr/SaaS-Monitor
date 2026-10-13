import { notificationRequestScreen } from "@/notifications/moment-data";
import { testNotificationContent } from "@/notifications/test-notification";

jest.mock("expo-notifications", () => ({}));

describe("testNotificationContent", () => {
  it("says what the dashboard's test says, in the screen's language", () => {
    expect(testNotificationContent("0123456789abcdef", "en")).toMatchObject({
      title: "Test celebration",
      body: "This is how your next payment will look and sound",
    });
    const french = testNotificationContent("0123456789abcdef", "fr");
    expect(french.title).not.toBe("Test celebration");
    expect(french.body).not.toBe("This is how your next payment will look and sound");
  });

  it("names its screen, for a tap to open it", () => {
    const content = testNotificationContent("0123456789abcdef", "en");
    expect(notificationRequestScreen({ content: { data: content.data } })).toBe("0123456789abcdef");
    expect(content.data).toEqual({ type: "test", screen: "0123456789abcdef", event: "payment" });
  });

  it("is time-sensitive, like the moments of screens", () => {
    expect(testNotificationContent("0123456789abcdef", "de").interruptionLevel).toBe("timeSensitive");
  });
});

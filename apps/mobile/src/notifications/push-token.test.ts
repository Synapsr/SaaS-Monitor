import { isNewDeviceToken } from "@/notifications/push-token";
import type { NotificationsStatus } from "@/notifications/status";

const ready = (deviceToken: string | null): NotificationsStatus => ({
  kind: "ready",
  tokens: { pushToken: "ExponentPushToken[abc]", deviceToken, apnsEnvironment: "production" },
});

describe("isNewDeviceToken", () => {
  it("ignores the token the app just fetched, which the system reports again", () => {
    expect(isNewDeviceToken(ready("a1b2"), "a1b2")).toBe(false);
  });

  it("takes a rolled token, for every screen's instance to hear of it", () => {
    expect(isNewDeviceToken(ready("a1b2"), "c3d4")).toBe(true);
    expect(isNewDeviceToken(ready(null), "c3d4")).toBe(true);
  });

  it("takes any token while the app has none yet", () => {
    expect(isNewDeviceToken({ kind: "loading" }, "a1b2")).toBe(true);
    expect(isNewDeviceToken({ kind: "unavailable", configured: true }, "a1b2")).toBe(true);
  });
});

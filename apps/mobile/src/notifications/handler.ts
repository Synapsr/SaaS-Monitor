import * as Notifications from "expo-notifications";
import { notificationScreen } from "@/notifications/moment-data";

/** The screen on display, whose moments already play as cards: no banner for them. */
let focusedScreen: string | null = null;

export function setFocusedScreen(key: string | null): void {
  focusedScreen = key;
}

/**
 * How notifications show while the app is open: as banners, except those of the screen on
 * display, which plays the same moment itself a few seconds later.
 */
export function handleForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const key = notificationScreen(notification.request.content.data);
      const onScreen = key !== null && key === focusedScreen;
      return {
        shouldShowBanner: !onScreen,
        shouldShowList: true,
        shouldPlaySound: !onScreen,
        shouldSetBadge: false,
      };
    },
  });
}

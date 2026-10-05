import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { registerScreens, retryUnregistrations } from "@/notifications/devices";
import { notificationScreen } from "@/notifications/moment-data";
import { notificationsStore, useNotificationsStatus } from "@/notifications/status";
import { reloadWidgets } from "@/screens/bridge";
import { screensStore, useScreens } from "@/screens/store";

/**
 * Everything notifications need while the app runs: the permission and push token (read again
 * when the app comes back, as Settings may have changed them), the registration of each screen
 * with its instance, opening the screen of a tapped notification, and fresh widgets when one
 * arrives.
 */
export function useNotifications(): void {
  const router = useRouter();
  const { ready, screens } = useScreens();
  const status = useNotificationsStatus();
  const pushToken = status.kind === "ready" ? status.pushToken : null;

  useEffect(() => {
    void notificationsStore.refresh();
    void retryUnregistrations();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void notificationsStore.refresh();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (ready && pushToken !== null) void registerScreens(screens, pushToken);
  }, [ready, screens, pushToken]);

  useEffect(() => {
    if (!ready) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      Notifications.clearLastNotificationResponse();
      const key = notificationScreen(response.notification.request.content.data);
      if (key !== null && screensStore.find(key)) {
        router.navigate({ pathname: "/screen/[key]", params: { key } });
      }
    };
    // The app may have been opened by a notification.
    open(Notifications.getLastNotificationResponse());
    const responses = Notifications.addNotificationResponseReceivedListener(open);
    const received = Notifications.addNotificationReceivedListener(() => void reloadWidgets());
    return () => {
      responses.remove();
      received.remove();
    };
  }, [ready, router]);
}

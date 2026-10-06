import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { registerScreens, retryUnregistrations } from "@/notifications/devices";
import { notificationRequestScreen } from "@/notifications/moment-data";
import { installationId, pauseStore, useNotificationsPaused } from "@/notifications/preferences";
import { isNewDeviceToken } from "@/notifications/push-token";
import { notificationsStore, useNotificationsStatus } from "@/notifications/status";
import { reloadWidgets } from "@/screens/bridge";
import { screensStore, useScreens } from "@/screens/store";

/**
 * Everything notifications need while the app runs: the permission and push tokens (read again
 * when the app comes back, as Settings may have changed them, and when the system rolls a token),
 * the registration of each screen with its instance, opening the screen of a tapped notification
 * (from Expo, APNs or FCM alike), and fresh widgets when one arrives.
 */
export function useNotifications(): void {
  const router = useRouter();
  const { ready, screens } = useScreens();
  const status = useNotificationsStatus();
  const tokens = status.kind === "ready" ? status.tokens : null;
  const paused = useNotificationsPaused();
  const [installation, setInstallation] = useState<string | null>(null);

  useEffect(() => {
    void pauseStore.load();
    void installationId().then(setInstallation);
    void notificationsStore.refresh();
    void retryUnregistrations();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void notificationsStore.refresh();
    });
    // A rolled token makes the old one fail: every screen hears of the new one at once.
    const rolled = Notifications.addPushTokenListener(({ data }) => {
      if (isNewDeviceToken(notificationsStore.getSnapshot(), data)) void notificationsStore.refresh();
    });
    return () => {
      appState.remove();
      rolled.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready || tokens === null || paused === null || installation === null) return;
    void registerScreens(screens, { installationId: installation, tokens, paused });
  }, [ready, screens, tokens, paused, installation]);

  useEffect(() => {
    if (!ready) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      Notifications.clearLastNotificationResponse();
      const key = notificationRequestScreen(response.notification.request);
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

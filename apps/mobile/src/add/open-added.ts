import * as Haptics from "expo-haptics";
import type { ImperativeRouter } from "expo-router";
import { notificationsStore } from "@/notifications/status";

/**
 * Opens a screen just added. After a first screen, notifications are explained before the system
 * asks: its prompt shows once.
 */
export async function openAddedScreen(
  router: ImperativeRouter,
  added: { key: string; first: boolean },
): Promise<void> {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  router.push({ pathname: "/screen/[key]", params: { key: added.key } });
  const notifications = await notificationsStore.refresh();
  if (added.first && notifications.kind === "undetermined") router.push("/notifications");
}

import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import type { Language } from "@/contract/screens/settings";
import { notificationsStore } from "@/notifications/status";
import { scheduleTestNotification, TEST_DELAY_SECONDS } from "@/notifications/test-notification";
import { CheckIcon } from "@/ui/icons";
import { SettingsRow } from "@/ui/settings-group";
import { colors } from "@/ui/theme";

/**
 * "Send a test notification": the screen's test, a few seconds later, from this device. It asks
 * for the permission first when the system hasn't yet.
 */
export function TestNotificationRow({ screen, language }: { screen: string; language: Language }) {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => setSent(false), TEST_DELAY_SECONDS * 1_000);
    return () => clearTimeout(timer);
  }, [sent]);

  async function send() {
    let status = notificationsStore.getSnapshot();
    if (status.kind === "undetermined") status = await notificationsStore.request();
    // Without push tokens (`unavailable`), the device still shows its own notifications.
    if (status.kind !== "ready" && status.kind !== "unavailable") return;
    try {
      await scheduleTestNotification(screen, language);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (error) {
      console.warn("The test notification could not be scheduled", error);
      Alert.alert("The test notification couldn’t be sent", "Try again in a moment.");
    }
  }

  return (
    <SettingsRow
      label={sent ? "On its way…" : "Send a test notification"}
      detail={`It arrives in ${TEST_DELAY_SECONDS} seconds, as this screen’s moments do: lock your phone to see it there, and on your watch.`}
      tone="accentInk"
      accessory={sent ? <CheckIcon size={18} color={colors.accentInk} /> : undefined}
      onPress={sent ? undefined : () => void send()}
    />
  );
}

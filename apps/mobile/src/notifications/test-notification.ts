import * as Notifications from "expo-notifications";
import { displayLocale } from "@/contract/display/i18n";
import type { Language } from "@/contract/screens/settings";
import { MOMENTS_CHANNEL } from "@/notifications/status";

/** Long enough to lock the phone, or lower the wrist, before it arrives. */
export const TEST_DELAY_SECONDS = 5;

/**
 * A screen's test notification, as its instance sends the dashboard's "Send a test celebration"
 * (`notifyTestCelebration` on the web): its words in the screen's language, its data naming the
 * screen, which a tap opens, and time-sensitive like every moment, for Siri to announce it in
 * CarPlay and on AirPods.
 */
export function testNotificationContent(
  screen: string,
  language: Language,
): Notifications.NotificationContentInput {
  const { text } = displayLocale(language);
  return {
    title: text.moments.test,
    body: text.moments.testDetails,
    data: { type: "test", screen, event: "payment" },
    sound: "default",
    interruptionLevel: "timeSensitive",
  };
}

/**
 * Schedules a screen's test on this device, without its instance: notifications can be tried
 * without a Stripe account, on the demo screen too. It arrives like the screen's moments do, on the
 * paired watch too, but with the system's sound: only moments sent by the instance play the
 * screen's.
 */
export async function scheduleTestNotification(screen: string, language: Language): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: testNotificationContent(screen, language),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_DELAY_SECONDS,
      channelId: MOMENTS_CHANNEL,
    },
  });
}

import { useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { notificationsStore } from "@/notifications/status";
import { Button } from "@/ui/button";
import { BellIcon, CircleDollarSignIcon, PartyPopperIcon, UserPlusIcon } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors } from "@/ui/theme";

const MOMENTS = [
  { icon: CircleDollarSignIcon, text: "Every payment, the second it lands" },
  { icon: UserPlusIcon, text: "New subscribers, upgrades and comebacks" },
  { icon: PartyPopperIcon, text: "Milestones, and the day you reach your goal" },
];

/**
 * Explains notifications before the system asks, after a first screen was added: the system's
 * prompt shows once, and a "no" sends people to Settings.
 */
export default function NotificationsPrompt() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 20, gap: 24 }}>
      <View style={{ alignItems: "center", gap: 12 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentWash }}>
          <BellIcon size={26} color={colors.accentInk} />
        </View>
        <AppText variant="title" style={{ textAlign: "center" }} accessibilityRole="header">
          Feel every moment
        </AppText>
        <AppText variant="callout" tone="ink2" style={{ textAlign: "center" }}>
          Your screens can tell this phone what happens, in their own language, even when the app
          is closed.
        </AppText>
      </View>
      <View style={{ gap: 14 }}>
        {MOMENTS.map(({ icon: Icon, text }) => (
          <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Icon size={20} color={colors.accent} />
            <AppText variant="callout" style={{ flex: 1 }}>
              {text}
            </AppText>
          </View>
        ))}
      </View>
      <AppText variant="caption" tone="ink3">
        Each screen chooses which events reach phones, and each can be silenced on this device.
      </AppText>
      <View style={{ gap: 8 }}>
        <Button
          label="Turn on notifications"
          onPress={async () => {
            await notificationsStore.request();
            router.back();
          }}
        />
        <Button label="Not now" variant="plain" onPress={() => router.back()} />
      </View>
    </View>
  );
}

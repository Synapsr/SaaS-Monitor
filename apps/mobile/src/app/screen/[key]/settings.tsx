import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { notificationsNote } from "@/notifications/describe";
import { notificationsStore, useNotificationsStatus } from "@/notifications/status";
import { removeScreen, renameScreen, setScreenNotifications } from "@/screens/actions";
import { instanceLabel, screenUrl } from "@/screens/link";
import { useScreen } from "@/screens/store";
import { displayName } from "@/screens/types";
import { Field } from "@/ui/field";
import { ExternalLinkIcon } from "@/ui/icons";
import { SettingsGroup, SettingsRow, SwitchRow } from "@/ui/settings-group";
import { AppText } from "@/ui/text";
import { colors } from "@/ui/theme";

/** A screen on this device: its name here, its notifications, and removing it. */
export default function ScreenSettings() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const screen = useScreen(key);
  const status = useNotificationsStatus();
  const [name, setName] = useState(screen ? displayName(screen) : "");

  if (!screen) return null;
  const note = notificationsNote(status);

  async function toggleNotifications(on: boolean) {
    if (!screen) return;
    // Turning a screen's notifications on is the moment to ask for the permission.
    if (on && status.kind === "undetermined") await notificationsStore.request();
    await setScreenNotifications(screen.key, on);
  }

  function confirmRemoval() {
    if (!screen) return;
    Alert.alert(
      `Remove “${displayName(screen)}”?`,
      "This device stops showing it and getting its notifications. The screen itself stays as it is.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void removeScreen(screen.key);
            router.dismissTo("/");
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 28 }} keyboardShouldPersistTaps="handled">
      <AppText variant="title" accessibilityRole="header">
        {displayName(screen)}
      </AppText>

      <SettingsGroup
        title="Name on this device"
        footer={screen.alias ? `Its name in SaaS Monitor is “${screen.name}”.` : "Only this device and its widgets use it."}
      >
        <View style={{ padding: 8 }}>
          <Field
            value={name}
            onChangeText={setName}
            onEndEditing={() => renameScreen(screen.key, name)}
            onSubmitEditing={() => renameScreen(screen.key, name)}
            placeholder={screen.name}
            returnKeyType="done"
            accessibilityLabel="Name on this device"
            style={{ backgroundColor: colors.surfaceRaised }}
          />
        </View>
      </SettingsGroup>

      <SettingsGroup
        title="Notifications"
        footer={
          note ??
          "Payments, new subscribers and the other events this screen sends to phones: its Events settings, column “Phone”, choose which."
        }
      >
        <SwitchRow
          label="Notifications on this device"
          value={screen.notify}
          disabled={status.kind === "denied" || status.kind === "unconfigured"}
          onValueChange={(on) => void toggleNotifications(on)}
        />
        {status.kind === "denied" && (
          <SettingsRow label="Open Settings" tone="accentInk" onPress={() => void Linking.openSettings()} />
        )}
      </SettingsGroup>

      <SettingsGroup title="Instance">
        <SettingsRow label={instanceLabel(screen.baseUrl)} detail={screen.accessProof ? "Protected by a password" : undefined} />
        <SettingsRow
          label="Open in the browser"
          tone="accentInk"
          accessory={<ExternalLinkIcon size={18} color={colors.accentInk} />}
          onPress={() => void Linking.openURL(screenUrl(screen))}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow label="Remove from this device" tone="danger" onPress={confirmRemoval} />
      </SettingsGroup>
    </ScrollView>
  );
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { SCREEN_EVENTS } from "@/contract/display/events";
import { recurringMetric } from "@/contract/display/metric";
import { notificationsNote } from "@/notifications/describe";
import { EVENT_LABELS, screenSendsEvent } from "@/notifications/events";
import { useNotificationsPaused } from "@/notifications/preferences";
import { notificationsStore, useNotificationsStatus } from "@/notifications/status";
import {
  rememberState,
  removeScreen,
  renameScreen,
  setEventMuted,
  setScreenNotifications,
} from "@/screens/actions";
import { fetchScreenState } from "@/screens/api";
import { instanceLabel, screenUrl } from "@/screens/link";
import { useCachedState } from "@/screens/state-cache";
import { screensStore, useScreen } from "@/screens/store";
import { displayName } from "@/screens/types";
import { Field } from "@/ui/field";
import { ExternalLinkIcon } from "@/ui/icons";
import { SettingsGroup, SettingsRow, SwitchRow } from "@/ui/settings-group";
import { AppText } from "@/ui/text";
import { colors } from "@/ui/theme";

/** A screen on this device: its name here, what this device hears of it, and removing it. */
export default function ScreenSettings() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const screen = useScreen(key);
  const state = useCachedState(key);
  const status = useNotificationsStatus();
  const paused = useNotificationsPaused() === true;
  const [name, setName] = useState(screen ? displayName(screen) : "");

  // The events the screen sends to phones come with its state.
  useEffect(() => {
    if (!key || state) return;
    const saved = screensStore.find(key);
    if (!saved) return;
    void fetchScreenState(saved).then((result) => {
      if (result.kind === "ok") rememberState(key, result.state);
    });
  }, [key, state]);

  if (!screen) return null;
  const blocked = status.kind === "denied" || status.kind === "unavailable";
  const metric = recurringMetric(state?.screen.settings.metric ?? "mrr").label;

  async function toggleNotifications(on: boolean) {
    if (!screen) return;
    // Turning a screen's notifications on is the moment to ask for the permission.
    if (on && status.kind === "undetermined") await notificationsStore.request();
    setScreenNotifications(screen.key, on);
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
          notificationsNote(status) ??
          (paused ? "Paused for every screen in the app’s settings: these choices come back when you resume." : null)
        }
      >
        <SwitchRow
          label="Notifications on this device"
          value={screen.notify}
          disabled={blocked}
          onValueChange={(on) => void toggleNotifications(on)}
        />
        {status.kind === "denied" && (
          <SettingsRow label="Open Settings" tone="accentInk" onPress={() => void Linking.openSettings()} />
        )}
      </SettingsGroup>

      {screen.notify && !blocked && (
        <SettingsGroup
          title="Events"
          footer="The screen chooses what it sends to phones: its Events settings, column “Phone”. Here, what this device hears of."
        >
          {SCREEN_EVENTS.map((event) => {
            const sent = screenSendsEvent(state, event) !== false;
            const { label, description } = EVENT_LABELS[event];
            return (
              <SwitchRow
                key={event}
                label={label(metric)}
                detail={sent ? description : "Not sent to phones by this screen"}
                value={sent && !screen.mutedEvents.includes(event)}
                disabled={!sent}
                onValueChange={(on) => setEventMuted(screen.key, event, !on)}
              />
            );
          })}
        </SettingsGroup>
      )}

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

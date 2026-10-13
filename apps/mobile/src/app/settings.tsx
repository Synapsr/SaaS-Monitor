import * as Application from "expo-application";
import Constants from "expo-constants";
import { Linking, ScrollView } from "react-native";
import { SoundsAndVoices } from "@/audio/sounds-and-voices";
import { CONTRACT_SOURCE } from "@/contract/source";
import { notificationsNote } from "@/notifications/describe";
import { pauseStore, useNotificationsPaused } from "@/notifications/preferences";
import { notificationsStore, useNotificationsStatus, type NotificationsStatus } from "@/notifications/status";
import { useScreens } from "@/screens/store";
import { ExternalLinkIcon } from "@/ui/icons";
import { SettingsGroup, SettingsRow, SwitchRow } from "@/ui/settings-group";
import { AppText } from "@/ui/text";
import { colors } from "@/ui/theme";

const REPOSITORY_URL = "https://github.com/Synapsr/SaaS-Monitor";
const HOSTED_URL = "https://saas-monitor.com";
const SELF_HOSTING_URL = `${REPOSITORY_URL}/blob/main/docs/self-hosting.md`;
/** The hosted service's policy, whose section "The SaaS Monitor app" covers the app. */
const PRIVACY_URL = `${HOSTED_URL}/privacy`;

const STATUS_LABELS: Record<NotificationsStatus["kind"], string> = {
  loading: "…",
  ready: "On",
  undetermined: "Not set up",
  denied: "Off",
  unavailable: "Unavailable",
};

/** The app itself: notifications, where SaaS Monitor lives, and what the app keeps. */
export default function Settings() {
  const status = useNotificationsStatus();
  const paused = useNotificationsPaused() === true;
  const { screens } = useScreens();
  const muted = screens.filter((screen) => !screen.notify).length;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, gap: 28 }}>
      <SettingsGroup
        title="Notifications"
        footer={
          notificationsNote(status) ??
          (!paused && muted > 0
            ? `${muted} of your screens ${muted === 1 ? "is" : "are"} silenced on this device.`
            : null)
        }
      >
        <SettingsRow
          label="Notifications"
          accessory={
            <AppText variant="body" tone="ink3">
              {status.kind === "ready" && paused ? "Paused" : STATUS_LABELS[status.kind]}
            </AppText>
          }
        />
        {status.kind === "ready" && (
          <SwitchRow
            label="Pause notifications"
            detail="Every screen stays silent on this device; their own choices come back when you resume."
            value={paused}
            onValueChange={(value) => pauseStore.setPaused(value)}
          />
        )}
        {status.kind === "undetermined" && (
          <SettingsRow label="Turn on notifications" tone="accentInk" onPress={() => void notificationsStore.request()} />
        )}
        {status.kind === "denied" && (
          <SettingsRow label="Open Settings" tone="accentInk" onPress={() => void Linking.openSettings()} />
        )}
      </SettingsGroup>

      <SoundsAndVoices />

      <SettingsGroup title="SaaS Monitor" footer="Open source, MIT licensed. Any instance works with this app, hosted or self-hosted.">
        <LinkRow label="Hosted instance" detail="saas-monitor.com" url={HOSTED_URL} />
        <LinkRow label="Source code on GitHub" detail="Synapsr/SaaS-Monitor" url={REPOSITORY_URL} />
        <LinkRow label="Host your own" detail="The self-hosting guide" url={SELF_HOSTING_URL} />
      </SettingsGroup>

      <SettingsGroup title="Privacy">
        <SettingsRow
          label="No account, no tracking"
          detail="Screens stay on this device, in its secure storage. The app talks only to your screens’ instances and, for notifications, to Apple’s, Google’s or Expo’s push services. With notifications on, each screen’s instance gets this device’s push tokens, a random installation ID, its language and your notification choices for the screen."
        />
        <LinkRow label="Privacy policy" detail="saas-monitor.com/privacy" url={PRIVACY_URL} />
      </SettingsGroup>

      <AppText variant="caption" tone="ink3" style={{ textAlign: "center" }}>
        {`Version ${appVersion()} · display contract ${CONTRACT_SOURCE}`}
      </AppText>
    </ScrollView>
  );
}

/** "1.0.0 (2)": the store version, and the build reviewers and testers see. */
function appVersion(): string {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "?";
  const build = Application.nativeBuildVersion;
  return build ? `${version} (${build})` : version;
}

function LinkRow({ label, detail, url }: { label: string; detail: string; url: string }) {
  return (
    <SettingsRow
      label={label}
      detail={detail}
      accessory={<ExternalLinkIcon size={18} color={colors.ink3} />}
      onPress={() => void Linking.openURL(url)}
    />
  );
}

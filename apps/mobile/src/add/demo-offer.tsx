import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";
import { demoErrorMessage } from "@/add/messages";
import { openAddedScreen } from "@/add/open-added";
import { addScreen } from "@/screens/actions";
import { demoLink, isDemoScreen } from "@/screens/demo";
import { instanceLabel } from "@/screens/link";
import { useScreens } from "@/screens/store";
import { Button } from "@/ui/button";
import { SparklesIcon } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors, radius } from "@/ui/theme";

type Status = { kind: "idle" } | { kind: "adding" } | { kind: "failed"; message: string };

const WATCH = Platform.OS === "ios" ? "Apple Watch" : "watch";

/**
 * Adds the demo screen of the hosted instance, as a screen of its own: the app, its widgets, the
 * watches and notifications show it like any other. Offline, or while its instance doesn't serve
 * it, the demo can still be previewed, simulated on the device.
 */
function useAddDemo(beforeOpen?: () => void) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function add() {
    if (status.kind === "adding") return;
    setStatus({ kind: "adding" });
    const link = demoLink();
    const result = await addScreen(link);
    if (result.kind === "added") {
      setStatus({ kind: "idle" });
      beforeOpen?.();
      await openAddedScreen(router, result);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setStatus({ kind: "failed", message: demoErrorMessage(instanceLabel(link.baseUrl)) });
  }

  function preview() {
    beforeOpen?.();
    router.push("/demo");
  }

  return { status, add: () => void add(), preview };
}

interface DemoOfferProps {
  /** `card` for people who have no screen yet; `link` once they have some, or have a link. */
  variant?: "card" | "link";
  /** Before the demo opens, e.g. closing the sheet it was added from. */
  beforeOpen?: () => void;
}

/**
 * The way in without a SaaS Monitor account (or before making one): the live demo screen. Gone
 * once the device has it.
 */
export function DemoOffer({ variant = "card", beforeOpen }: DemoOfferProps) {
  const { status, add, preview } = useAddDemo(beforeOpen);
  const added = useScreens().screens.some(isDemoScreen);
  if (added) return null;
  const adding = status.kind === "adding";
  const failure = status.kind === "failed" && (
    <View style={{ gap: 2 }}>
      <AppText variant="callout" tone="danger" accessibilityRole="alert">
        {status.message}
      </AppText>
      <Button label="Preview the demo" variant="plain" onPress={preview} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} />
    </View>
  );

  if (variant === "link") {
    return (
      <View style={{ gap: 6 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: adding }}
          disabled={adding}
          onPress={add}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}
        >
          {adding ? <ActivityIndicator color={colors.accentInk} /> : <SparklesIcon size={18} color={colors.accentInk} />}
          <View style={{ flex: 1 }}>
            <AppText variant="callout" tone="accentInk">
              Add the demo screen
            </AppText>
            <AppText variant="caption" tone="ink3">
              A sample company, live: no account needed.
            </AppText>
          </View>
        </Pressable>
        {failure}
      </View>
    );
  }

  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: radius.large,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <SparklesIcon size={20} color={colors.accent} />
        <AppText variant="headline" style={{ flex: 1 }} accessibilityRole="header">
          No account? Try the demo
        </AppText>
      </View>
      <AppText variant="callout" tone="ink2">
        A sample company, live: no account needed. Widgets, your {WATCH} and notifications work
        with it too.
      </AppText>
      <Button label="Add the demo screen" variant="secondary" icon={SparklesIcon} loading={adding} onPress={add} />
      {failure}
    </View>
  );
}

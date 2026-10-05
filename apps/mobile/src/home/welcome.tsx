import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RadialGlow } from "@/display/radial-glow";
import { Button } from "@/ui/button";
import { ClipboardPasteIcon, LogoPulse, ScanQrCodeIcon } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors } from "@/ui/theme";

/** The first launch: what the app does, and how to add a first screen. */
export function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: insets.bottom + 24, gap: 32 }}
    >
      <View style={{ alignItems: "center", gap: 18 }}>
        <View style={{ width: 120, height: 120, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 220, height: 220 }}>
            <RadialGlow color={colors.accent} opacity={0.22} />
          </View>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0a0a0a",
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <LogoPulse height={30} color={colors.accent} />
          </View>
        </View>
        <AppText variant="largeTitle" style={{ textAlign: "center" }} accessibilityRole="header">
          Your screens, in your pocket
        </AppText>
        <AppText variant="body" tone="ink2" style={{ textAlign: "center", maxWidth: 420 }}>
          Watch your MRR live, turn your phone sideways for TV mode, and feel every sale the moment
          it happens.
        </AppText>
      </View>
      <View style={{ gap: 12, width: "100%", maxWidth: 420, alignSelf: "center" }}>
        <Button label="Scan a QR code" icon={ScanQrCodeIcon} onPress={() => router.push("/add")} />
        <Button
          label="Paste a link"
          variant="secondary"
          icon={ClipboardPasteIcon}
          onPress={() => router.push({ pathname: "/add", params: { mode: "link" } })}
        />
        <AppText variant="caption" tone="ink3" style={{ textAlign: "center", paddingHorizontal: 12 }}>
          In SaaS Monitor, open a screen’s settings and choose “Open on your phone” to show its QR
          code.
        </AppText>
      </View>
      <Button label="Try the demo screen" variant="plain" onPress={() => router.push("/demo")} />
    </ScrollView>
  );
}

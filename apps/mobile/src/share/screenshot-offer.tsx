import * as ScreenCapture from "expo-screen-capture";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDisplay } from "@/display/context";
import { DisplayText } from "@/display/text";
import { ImageIcon, XIcon } from "@/ui/icons";

/** Long enough to read and reach, short enough not to linger over the numbers. */
const OFFER_MS = 7_000;

/**
 * After a screenshot of a screen, offers a cleaner image of it: its numbers without the app's
 * buttons and status bar, signed. Nothing to allow: iOS tells apps about screenshots, and Android
 * does from Android 14.
 */
export function ScreenshotOffer({ onShare }: { onShare: () => void }) {
  const { palette, scale } = useDisplay();
  const insets = useSafeAreaInsets();
  // Each screenshot brings the offer back, for its own seven seconds.
  const [offer, setOffer] = useState<number | null>(null);

  useEffect(() => {
    const subscription = ScreenCapture.addScreenshotListener(() => setOffer(Date.now()));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (offer === null) return;
    const timer = setTimeout(() => setOffer(null), OFFER_MS);
    return () => clearTimeout(timer);
  }, [offer]);

  if (offer === null) return null;
  return (
    <Animated.View
      key={offer}
      entering={FadeInUp.springify().damping(18)}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="box-none"
      // Under the top bar: both systems show their own screenshot tools at the bottom.
      style={{ position: "absolute", left: 16, right: 16, top: insets.top + 56 * scale, alignItems: "center" }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens an image of this screen to share"
        onPress={() => {
          setOffer(null);
          onShare();
        }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12 * scale,
          maxWidth: 440 * scale,
          paddingVertical: 10 * scale,
          paddingLeft: 12 * scale,
          paddingRight: 6 * scale,
          borderRadius: 22 * scale,
          backgroundColor: palette.popover,
          borderWidth: 1,
          borderColor: palette.edge,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            width: 36 * scale,
            height: 36 * scale,
            borderRadius: 18 * scale,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.glowWash,
          }}
        >
          <ImageIcon size={18 * scale} color={palette.glowInk} strokeWidth={2.2} />
        </View>
        <View style={{ flexShrink: 1, gap: 1 }}>
          <DisplayText size={15} weight="600" numberOfLines={1}>
            Share a cleaner image
          </DisplayText>
          <DisplayText size={12.5} tone="ink3" numberOfLines={2}>
            This screen without the app around it
          </DisplayText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
          onPress={() => setOffer(null)}
          style={{ padding: 8 * scale }}
        >
          <XIcon size={16 * scale} color={palette.ink3} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

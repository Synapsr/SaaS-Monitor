import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { defaultScreenSettings } from "@/contract/screens/settings";
import { Backdrop } from "@/display/backdrop";
import { DisplayProvider, useDisplay, type DisplayLayout } from "@/display/context";
import { DisplayText } from "@/display/text";
import type { ScreenAppearance } from "@/screens/types";

interface ScreenShellProps {
  /** How the screen looked last time; the default look until it was seen. */
  appearance: ScreenAppearance | null;
  layout: DisplayLayout;
  scale: number;
  name: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}

/**
 * A screen before its numbers: loading, locked, gone or unreachable. It keeps the screen's
 * language and colors, so that nothing flashes from one look to another.
 */
export function ScreenShell({ appearance, layout, scale, ...props }: ScreenShellProps) {
  const { language, theme, accent } = appearance ?? defaultScreenSettings;
  return (
    <DisplayProvider language={language} theme={theme} accent={accent} layout={layout} scale={scale}>
      <Shell {...props} />
    </DisplayProvider>
  );
}

function Shell({ name, leading, trailing, children }: Omit<ScreenShellProps, "appearance" | "layout" | "scale">) {
  const { palette, scale } = useDisplay();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.screen,
        paddingTop: insets.top + 6,
        paddingBottom: insets.bottom,
        paddingLeft: Math.max(insets.left, 16 * scale),
        paddingRight: Math.max(insets.right, 16 * scale),
      }}
    >
      <Backdrop />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 * scale, minHeight: 32 * scale }}>
        {leading}
        <DisplayText size={17} weight="600" numberOfLines={1} style={{ flex: 1 }}>
          {name}
        </DisplayText>
        {trailing}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

import { Text, type TextProps, type TextStyle } from "react-native";
import { colors } from "@/ui/theme";

/** The app's type scale, in points; Dynamic Type scales it further. */
const VARIANTS = {
  largeTitle: { fontSize: 32, fontWeight: "700", letterSpacing: -0.6, lineHeight: 38 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4, lineHeight: 30 },
  headline: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 22 },
  callout: { fontSize: 15, fontWeight: "400", lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "500", letterSpacing: 0.2, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

type Tone = "ink" | "ink2" | "ink3" | "accent" | "accentInk" | "danger" | "onAccent";

interface AppTextProps extends TextProps {
  variant?: keyof typeof VARIANTS;
  tone?: Tone;
  tabular?: boolean;
}

export function AppText({ variant = "body", tone = "ink", tabular, style, ...props }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={2}
      style={[VARIANTS[variant], { color: colors[tone] }, tabular && { fontVariant: ["tabular-nums"] }, style]}
      {...props}
    />
  );
}

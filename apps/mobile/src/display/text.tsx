import { Text, type TextProps, type TextStyle } from "react-native";
import { useDisplay } from "@/display/context";
import type { DisplayPalette } from "@/display/palette";

type Tone = "ink" | "ink2" | "ink3" | "glow" | "glowInk" | "warnInk";

interface DisplayTextProps extends TextProps {
  /** Font size in points, before the display's scale. */
  size: number;
  weight?: TextStyle["fontWeight"];
  tone?: Tone;
  /** Digits of the same width, so that changing numbers don't jitter. */
  tabular?: boolean;
  /** Letter spacing in ems, like the web's `tracking-*`. */
  tracking?: number;
  /** Line height as a ratio of the size. */
  leading?: number;
}

/**
 * Text of a screen, in its palette and at its scale. It follows Dynamic Type, within limits: a
 * layout as dense as a wall display must still fit.
 */
export function DisplayText({
  size,
  weight = "400",
  tone = "ink",
  tabular = false,
  tracking,
  leading,
  style,
  maxFontSizeMultiplier,
  ...props
}: DisplayTextProps) {
  const { palette, scale, layout } = useDisplay();
  const fontSize = size * scale;
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (layout === "wall" ? 1.15 : 1.6)}
      style={[
        {
          color: palette[tone satisfies keyof DisplayPalette],
          fontSize,
          fontWeight: weight,
          fontVariant: tabular ? ["tabular-nums"] : undefined,
          letterSpacing: tracking === undefined ? undefined : tracking * fontSize,
          lineHeight: leading === undefined ? undefined : leading * fontSize,
        },
        style,
      ]}
      {...props}
    />
  );
}

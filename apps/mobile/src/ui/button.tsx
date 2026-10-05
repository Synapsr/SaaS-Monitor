import { createElement } from "react";
import { ActivityIndicator, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import type { LucideProps } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors, radius } from "@/ui/theme";

type Variant = "primary" | "secondary" | "plain" | "destructive";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: Variant;
  icon?: (props: Pick<LucideProps, "size" | "color" | "strokeWidth">) => React.ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BACKGROUNDS: Record<Variant, string> = {
  primary: colors.accent,
  secondary: colors.surfaceRaised,
  plain: "transparent",
  destructive: "rgba(251, 113, 133, 0.12)",
};

const INKS = { primary: "onAccent", secondary: "ink", plain: "accentInk", destructive: "danger" } as const;

/** A button of the app: large enough to hit, pressed with a slight sink. */
export function Button({ label, variant = "primary", icon, loading = false, disabled, style, ...props }: ButtonProps) {
  const ink = colors[INKS[variant]];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        {
          minHeight: 50,
          borderRadius: radius.medium,
          paddingHorizontal: 18,
          backgroundColor: BACKGROUNDS[variant],
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: colors.hairline,
          opacity: inactive && !loading ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          justifyContent: "center",
        },
        style,
      ]}
      {...props}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {loading ? (
          <ActivityIndicator color={ink} />
        ) : (
          icon && createElement(icon, { size: 19, color: ink, strokeWidth: 2.2 })
        )}
        <AppText variant="headline" style={{ color: ink }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

/** A round button with an icon only, for headers and top bars. */
export function IconButton({
  icon,
  label,
  color = colors.ink,
  background = colors.fill,
  size = 36,
  ...props
}: Omit<PressableProps, "children" | "style"> & {
  icon: (props: Pick<LucideProps, "size" | "color" | "strokeWidth">) => React.ReactNode;
  label: string;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background,
        opacity: pressed ? 0.7 : 1,
      })}
      {...props}
    >
      {createElement(icon, { size: size * 0.52, color, strokeWidth: 2.2 })}
    </Pressable>
  );
}

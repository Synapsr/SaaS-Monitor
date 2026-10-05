import { Children, Fragment, type ReactNode } from "react";
import { Pressable, Switch, View } from "react-native";
import { AppText } from "@/ui/text";
import { colors, radius } from "@/ui/theme";

/** Rows of settings on a card, with a title above and a note below. */
export function SettingsGroup({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: 8 }}>
      {title && (
        <AppText variant="label" tone="ink3" style={{ paddingHorizontal: 16, textTransform: "uppercase" }}>
          {title}
        </AppText>
      )}
      <View style={{ borderRadius: radius.large, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, overflow: "hidden" }}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={{ height: 1, marginLeft: 16, backgroundColor: colors.hairline }} />}
            {row}
          </Fragment>
        ))}
      </View>
      {footer && (
        <AppText variant="caption" tone="ink3" style={{ paddingHorizontal: 16 }}>
          {footer}
        </AppText>
      )}
    </View>
  );
}

interface RowProps {
  label: string;
  detail?: string;
  /** Shown at the end of the row: a value, a switch, a chevron. */
  accessory?: ReactNode;
  onPress?: () => void;
  tone?: "ink" | "danger" | "accentInk";
}

export function SettingsRow({ label, detail, accessory, onPress, tone = "ink" }: RowProps) {
  const content = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" tone={tone}>
          {label}
        </AppText>
        {detail && (
          <AppText variant="caption" tone="ink3">
            {detail}
          </AppText>
        )}
      </View>
      {accessory}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceRaised : "transparent" })}>
      {content}
    </Pressable>
  );
}

export function SwitchRow({
  label,
  detail,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SettingsRow
      label={label}
      detail={detail}
      accessory={
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ true: colors.accent, false: colors.fill }}
          ios_backgroundColor={colors.fill}
        />
      }
    />
  );
}

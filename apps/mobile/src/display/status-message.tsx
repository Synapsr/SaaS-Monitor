import type { ReactNode } from "react";
import { View } from "react-native";
import { recurringMetric } from "@/contract/display/metric";
import type { DisplayState } from "@/contract/display/types";
import { useDisplay } from "@/display/context";
import { DisplayText } from "@/display/text";
import { CircleAlertIcon, LogoPulse, PlugIcon, type LucideProps } from "@/ui/icons";

interface StatusMessageProps {
  icon: (props: Pick<LucideProps, "size" | "color">) => ReactNode;
  title: string;
  details?: string;
  /** Problems are shown in neutral tones: the accent is kept for good news. */
  tone?: "glow" | "neutral";
  children?: ReactNode;
}

/** A calm message in place of the numbers: empty screens, imports, broken links. */
export function StatusMessage({ icon: Icon, title, details, tone = "glow", children }: StatusMessageProps) {
  const { palette, scale, layout } = useDisplay();
  const wall = layout === "wall";
  const disc = (wall ? 56 : 72) * scale;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 * scale, paddingVertical: 32 * scale }}>
      <View style={{ maxWidth: 520 * scale, alignItems: "center", gap: 14 * scale }}>
        <View
          style={{
            width: disc,
            height: disc,
            borderRadius: disc / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.hairline,
          }}
        >
          <Icon size={disc * 0.4} color={tone === "glow" ? palette.glow : palette.ink2} />
        </View>
        <DisplayText size={wall ? 22 : 24} weight="600" tracking={-0.015} style={{ textAlign: "center" }} accessibilityRole="header">
          {title}
        </DisplayText>
        {details && (
          <DisplayText size={wall ? 14 : 16} tone="ink2" style={{ textAlign: "center" }} leading={1.4}>
            {details}
          </DisplayText>
        )}
        {children}
      </View>
    </View>
  );
}

/** What a screen shows until it has numbers: no account yet, the first import, or broken keys. */
export function StateStatus({ state }: { state: DisplayState }) {
  const { locale, palette, scale } = useDisplay();
  const { text } = locale;

  if (state.status === "importing") {
    return (
      <StatusMessage
        icon={({ size }) => <LogoPulse height={Number(size) * 0.8} color={palette.glow} />}
        title={text.status.importing}
        details={text.status.importingDetails}
      >
        {state.accounts.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 * scale }}>
            {state.accounts.map((account) => (
              <View
                key={account.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8 * scale,
                  borderRadius: 999,
                  paddingHorizontal: 12 * scale,
                  paddingVertical: 6 * scale,
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: palette.hairline,
                }}
              >
                <View
                  style={{
                    width: 7 * scale,
                    height: 7 * scale,
                    borderRadius: 4 * scale,
                    backgroundColor:
                      account.status === "ready" ? palette.glow : account.status === "error" ? palette.warn : palette.ink3,
                  }}
                />
                <DisplayText size={13}>{account.name}</DisplayText>
                <DisplayText size={13} tone="ink3">
                  {text.accountStatus[account.status]}
                </DisplayText>
              </View>
            ))}
          </View>
        )}
      </StatusMessage>
    );
  }

  if (state.status === "error") {
    return (
      <StatusMessage icon={CircleAlertIcon} title={text.status.failing} details={text.status.failingDetails} tone="neutral" />
    );
  }

  return (
    <StatusMessage
      icon={PlugIcon}
      title={text.status.empty}
      details={text.status.emptyDetails(state.screen.name, recurringMetric(state.screen.settings.metric).label)}
    />
  );
}

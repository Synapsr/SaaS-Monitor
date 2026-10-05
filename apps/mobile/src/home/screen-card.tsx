import { Pressable, View } from "react-native";
import { accentSwatch } from "@/contract/display/accents";
import { formatAmount, formatPercent, percentChange } from "@/contract/display/format";
import { displayLocale } from "@/contract/display/i18n";
import { recurringMetric } from "@/contract/display/metric";
import type { DisplayState } from "@/contract/display/types";
import { instanceLabel } from "@/screens/link";
import { displayName, type SavedScreen } from "@/screens/types";
import type { ScreenSummary } from "@/screens/use-screen-summaries";
import { IconButton } from "@/ui/button";
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, LockIcon, LogoPulse } from "@/ui/icons";
import { AppText } from "@/ui/text";
import { colors, radius } from "@/ui/theme";

interface ScreenCardProps {
  screen: SavedScreen;
  summary: ScreenSummary;
  /** Reordering: arrows replace the chevron. */
  editing: boolean;
  first: boolean;
  last: boolean;
  onPress: () => void;
  onMove: (offset: number) => void;
}

/** A screen of the list: its name and instance, and its recurring revenue when it has some. */
export function ScreenCard({ screen, summary, editing, first, last, onPress, onMove }: ScreenCardProps) {
  const accent = accentSwatch(screen.appearance?.accent ?? "emerald");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens the screen"
      disabled={editing}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 16,
        borderRadius: radius.large,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          borderWidth: 1,
          borderColor: colors.hairline,
        }}
      >
        <LogoPulse height={14} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <AppText variant="headline" numberOfLines={1}>
          {displayName(screen)}
        </AppText>
        <AppText variant="caption" tone="ink3" numberOfLines={1}>
          {instanceLabel(screen.baseUrl)}
        </AppText>
      </View>
      {editing ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <IconButton icon={ChevronUpIcon} label="Move up" disabled={first} onPress={() => onMove(-1)} />
          <IconButton icon={ChevronDownIcon} label="Move down" disabled={last} onPress={() => onMove(1)} />
        </View>
      ) : (
        <>
          <Summary summary={summary} />
          <ChevronRightIcon size={18} color={colors.ink3} />
        </>
      )}
    </Pressable>
  );
}

function Summary({ summary }: { summary: ScreenSummary }) {
  switch (summary.kind) {
    case "loading":
      return null;
    case "ok":
      return <Numbers state={summary.state} />;
    case "locked":
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <LockIcon size={14} color={colors.ink3} />
          <AppText variant="caption" tone="ink3">
            Password
          </AppText>
        </View>
      );
    case "gone":
      return (
        <AppText variant="caption" tone="danger">
          Link no longer works
        </AppText>
      );
    case "failed":
      return (
        <AppText variant="caption" tone="ink3">
          Offline
        </AppText>
      );
  }
}

/** MRR (or ARR) in the screen's own format, and its change in 30 days. */
function Numbers({ state }: { state: DisplayState }) {
  if (state.status !== "ready") {
    const label = { empty: "No Stripe account", importing: "Importing…", error: "Failing" }[state.status];
    return (
      <AppText variant="caption" tone="ink3">
        {label}
      </AppText>
    );
  }
  const { locale } = displayLocale(state.screen.settings.language);
  const recurring = recurringMetric(state.screen.settings.metric);
  const { mrr, mrr30DaysAgo } = state.metrics;
  const ratio = percentChange(mrr, mrr30DaysAgo);
  const growing = ratio === null || ratio >= 0;
  return (
    <View style={{ alignItems: "flex-end", gap: 2 }}>
      <AppText variant="headline" tabular numberOfLines={1}>
        {formatAmount(recurring.fromMrr(mrr), state.currency, locale)}
        <AppText variant="caption" tone="ink3">{` ${recurring.label}`}</AppText>
      </AppText>
      {ratio !== null && (
        <AppText variant="caption" tone={growing ? "accentInk" : "ink2"} tabular>
          {`${growing ? "↗" : "↘"} ${formatPercent(ratio, locale, { signed: true })}`}
        </AppText>
      )}
    </View>
  );
}

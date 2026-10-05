import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { customerLabel } from "@/contract/display/customer";
import {
  isGoodNews,
  itemAmount,
  itemKindLabel,
  itemOriginalAmount,
  warningText,
} from "@/contract/display/feed";
import { countryFlag, countryName } from "@/contract/display/format";
import type { RecurringMetric } from "@/contract/display/metric";
import { formatFeedTime } from "@/contract/display/time";
import type { DisplayWarning, FeedItem } from "@/contract/display/types";
import { useDisplay } from "@/display/context";
import { KindIcon } from "@/display/kind-icon";
import { DisplayText } from "@/display/text";
import { useNow } from "@/display/use-now";
import { InfoIcon } from "@/ui/icons";

/** More than a wall can show: the rest fades out at the bottom. */
const MAX_ITEMS = 14;

interface LiveFeedProps {
  feed: FeedItem[];
  /** Subscription changes read "+$149 MRR", or "+$1,788 ARR". */
  recurring: RecurringMetric;
  currency: string;
  timeZone: string;
  showAccount: boolean;
  warnings: DisplayWarning[];
}

/** The latest activity, newest first: what just arrived glows for a moment. */
export function LiveFeed({ feed, recurring, currency, timeZone, showAccount, warnings }: LiveFeedProps) {
  const { locale: displayLocale, palette, scale, layout } = useDisplay();
  const { text } = displayLocale;
  const now = useNow(15_000);
  // Items already there when the screen opened never glow: only what happens next does.
  const [initialIds] = useState(() => new Set(feed.map((item) => item.id)));
  const wall = layout === "wall";
  const items = feed.slice(0, MAX_ITEMS);

  return (
    <View
      style={{
        flex: wall ? 1 : undefined,
        minHeight: 0,
        borderRadius: (wall ? 20 : 24) * scale,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.hairline,
        overflow: "hidden",
      }}
    >
      <DisplayText
        size={wall ? 12 : 15}
        weight="500"
        tone="ink2"
        accessibilityRole="header"
        style={{ paddingHorizontal: (wall ? 14 : 18) * scale, paddingTop: (wall ? 12 : 16) * scale, paddingBottom: 4 * scale }}
      >
        {text.feed.title}
      </DisplayText>
      <View style={{ flex: wall ? 1 : undefined, minHeight: 0, overflow: "hidden" }}>
        {items.length === 0 ? (
          <DisplayText
            size={wall ? 12 : 15}
            tone="ink3"
            style={{ paddingHorizontal: (wall ? 14 : 18) * scale, paddingVertical: 12 * scale }}
          >
            {text.feed.empty}
          </DisplayText>
        ) : (
          <View style={{ paddingHorizontal: (wall ? 6 : 8) * scale, paddingBottom: 8 * scale }}>
            {items.map((item) => (
              <FeedRow
                key={item.id}
                item={item}
                recurring={recurring}
                currency={currency}
                relativeTime={formatFeedTime(new Date(item.occurredAt), new Date(now), timeZone, displayLocale)}
                showAccount={showAccount}
                arrived={item.live && !initialIds.has(item.id)}
              />
            ))}
          </View>
        )}
        {wall && <BottomFade color={palette.screen} />}
      </View>
      {warnings.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            gap: 8 * scale,
            alignItems: "flex-start",
            borderTopWidth: 1,
            borderTopColor: palette.hairline,
            paddingHorizontal: (wall ? 14 : 18) * scale,
            paddingVertical: 10 * scale,
          }}
        >
          <InfoIcon size={(wall ? 11 : 13) * 1.1 * scale} color={palette.ink3} />
          <DisplayText size={wall ? 10 : 12} tone="ink3" numberOfLines={2} style={{ flex: 1 }}>
            {warningText(warnings[0], text)}
          </DisplayText>
        </View>
      )}
    </View>
  );
}

interface FeedRowProps {
  item: FeedItem;
  recurring: RecurringMetric;
  currency: string;
  relativeTime: string;
  showAccount: boolean;
  arrived: boolean;
}

function FeedRow({ item, recurring, currency, relativeTime, showAccount, arrived }: FeedRowProps) {
  const { locale: displayLocale, palette, scale, layout } = useDisplay();
  const { language, locale, text } = displayLocale;
  const wall = layout === "wall";
  const amount = itemAmount(item, currency, recurring, locale);
  const original = itemOriginalAmount(item, recurring, locale);
  const kind = itemKindLabel(item, text);
  const customer = customerLabel(item);
  // A new customer has no amount: their name leads, or what they are when it is hidden.
  const headline = amount ?? customer ?? kind;
  // The column is narrow: a flag stands for the country.
  const country = item.country && countryName(item.country, language);
  const flag = countryFlag(item.country);
  const details = [headline === kind ? null : kind, amount === null ? null : customer, item.planName].filter(
    (part): part is string => Boolean(part),
  );
  const line = details.length > 0 ? details.join(" · ") : (country ?? "");
  const headlineSize = wall ? 14.5 : 17;
  const small = wall ? 10 : 13;

  return (
    <Animated.View
      entering={arrived ? FadeInUp.springify().damping(18) : FadeIn.duration(300)}
      layout={LinearTransition.springify().damping(20)}
      accessible
      accessibilityLabel={[headline, kind !== headline ? kind : null, customer, item.planName, country, relativeTime]
        .filter(Boolean)
        .join(", ")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: (wall ? 10 : 12) * scale,
        paddingHorizontal: (wall ? 8 : 10) * scale,
        paddingVertical: (wall ? 6 : 9) * scale,
        borderRadius: 14 * scale,
      }}
    >
      {arrived && <ArrivalGlow color={palette.glowWash} />}
      <KindIcon item={item} size={wall ? 30 : 40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 * scale }}>
          <DisplayText
            size={headlineSize}
            weight="600"
            tone={isGoodNews(item.kind) ? "ink" : "ink2"}
            tabular
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {headline}
            {amount !== null && item.kind !== "payment" && (
              <DisplayText size={small} weight="500" tone="ink3">
                {` ${recurring.label}`}
              </DisplayText>
            )}
            {original && (
              <DisplayText size={small} tone="ink3">
                {`  ${original}`}
              </DisplayText>
            )}
          </DisplayText>
          <DisplayText size={small} tone="ink3" numberOfLines={1} style={{ flexShrink: 0, maxWidth: "45%" }}>
            {showAccount ? `${item.accountName} · ${relativeTime}` : relativeTime}
          </DisplayText>
        </View>
        {(flag || line) && (
          <DisplayText size={wall ? 11 : 14} tone="ink2" numberOfLines={1}>
            {flag ? `${flag}  ` : ""}
            {line}
          </DisplayText>
        )}
      </View>
    </Animated.View>
  );
}

/** A new row glows for a moment, then settles like the others (the web's `display-arrival`). */
function ArrivalGlow({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withDelay(1750, withTiming(0, { duration: 3250 }));
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderRadius: 14, backgroundColor: color }, style]}
    />
  );
}

/** What doesn't fit fades out at the bottom of the column. */
function BottomFade({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "22%" }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="feedFade" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="1" stopColor={color} stopOpacity={0.9} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#feedFade)" />
      </Svg>
    </View>
  );
}

import { useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { formatAmount, formatPercent, percentChange } from "@/contract/display/format";
import { recurringMetric, type RecurringMetric } from "@/contract/display/metric";
import type { DisplayMetrics } from "@/contract/display/types";
import { formatMoney } from "@/contract/money";
import { useDisplay } from "@/display/context";
import { moneyParts } from "@/display/money-parts";
import { RadialGlow } from "@/display/radial-glow";
import { DisplayText } from "@/display/text";
import { useTween } from "@/display/use-tween";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { TrendingDownIcon, TrendingUpIcon } from "@/ui/icons";

interface HeroProps {
  metrics: DisplayMetrics;
  /** MRR or ARR in large, the other one under it. */
  recurring: RecurringMetric;
  currency: string;
  /** The account whose numbers these are, on a screen rotating between its accounts. */
  account: string | null;
  /** Lights up (or gently dims) the number while an MRR change is being celebrated. */
  highlight: "up" | "down" | null;
  /** Largest size of the number, before the display's scale. */
  maxSize: number;
}

/** The screen's recurring revenue, as large as its column allows, and how it grew in 30 days. */
export function Hero({ metrics, recurring, currency, account, highlight, maxSize }: HeroProps) {
  const { locale, text } = useDisplay().locale;
  const { palette, scale, layout } = useDisplay();
  const value = recurring.fromMrr(metrics.mrr);
  const other = recurringMetric(recurring.other);
  const label = layout === "wall" ? 13 : 15;

  return (
    <View style={{ gap: 4 * scale }}>
      <DisplayText size={label} weight="500" tone="ink2" numberOfLines={1}>
        {account && (
          <>
            <DisplayText size={label} weight="600">
              {account}
            </DisplayText>
            <DisplayText size={label} tone="ink3">
              {" · "}
            </DisplayText>
          </>
        )}
        {text.metricNames[recurring.metric]}
      </DisplayText>
      <HeroNumber value={value} currency={currency} highlight={highlight} maxSize={maxSize} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12 * scale, rowGap: 6 * scale }}>
        <Growth value={value} before={recurring.fromMrr(metrics.mrr30DaysAgo)} currency={currency} />
        <DisplayText size={label - 1} tone="ink3">
          {other.label}{" "}
          <DisplayText size={label - 1} weight="500" tone="ink2" tabular>
            {formatAmount(other.fromMrr(metrics.mrr), currency, locale)}
          </DisplayText>
        </DisplayText>
      </View>
      <HeroGlow visible={highlight === "up"} color={palette.glow} />
    </View>
  );
}

/**
 * The number itself, rolling to each new value. Sized from the column's width and the number
 * of characters, so that any amount fits on one line; the currency symbol sits smaller.
 */
function HeroNumber({
  value,
  currency,
  highlight,
  maxSize,
}: {
  value: number;
  currency: string;
  highlight: "up" | "down" | null;
  maxSize: number;
}) {
  const { locale } = useDisplay().locale;
  const { scale } = useDisplay();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const shown = useTween(value, 1400, !reducedMotion);
  const parts = moneyParts(Math.round(shown), currency, locale);
  const characters = formatMoney(value, currency, { locale }).length;
  const size = Math.min(maxSize * scale, width > 0 ? width / (characters * 0.56) : maxSize * scale);
  const dimmed = useAnimatedStyle(() => ({
    opacity: withTiming(highlight === "down" ? 0.75 : 1, { duration: 700 }),
  }));

  return (
    <Animated.View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[{ flexDirection: "row", alignItems: "flex-start" }, dimmed]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={formatMoney(value, currency, { locale })}
    >
      {parts.before !== "" && <Symbol size={size}>{parts.before}</Symbol>}
      <DisplayText
        size={size / scale}
        weight="600"
        tabular
        tracking={-0.045}
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{ lineHeight: size * 1.08 }}
      >
        {/* French groups digits with a narrow space, which the number's tight tracking would hide. */}
        {parts.number.replace(/\u202f/g, "\u00a0")}
      </DisplayText>
      {parts.after !== "" && <Symbol size={size}>{` ${parts.after}`}</Symbol>}
    </Animated.View>
  );
}

/** The currency symbol: smaller and quieter than the digits, raised to their cap height. */
function Symbol({ size, children }: { size: number; children: string }) {
  const { scale } = useDisplay();
  return (
    <DisplayText
      size={(size * 0.56) / scale}
      weight="500"
      tone="ink2"
      maxFontSizeMultiplier={1}
      style={{ marginTop: size * 0.14, marginHorizontal: size * 0.03 }}
    >
      {children}
    </DisplayText>
  );
}

function Growth({ value, before, currency }: { value: number; before: number; currency: string }) {
  const { locale, text } = useDisplay().locale;
  const { palette, scale, layout } = useDisplay();
  const change = value - before;
  const ratio = percentChange(value, before);
  const growing = change >= 0;
  const Icon = growing ? TrendingUpIcon : TrendingDownIcon;
  const size = layout === "wall" ? 12 : 14;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 * scale }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6 * scale,
          paddingVertical: 4 * scale,
          paddingLeft: 9 * scale,
          paddingRight: 11 * scale,
          borderRadius: 999,
          backgroundColor: growing ? palette.glowWash : palette.fill,
        }}
      >
        <Icon size={size * 1.1 * scale} color={growing ? palette.glowInk : palette.ink2} strokeWidth={2.25} />
        <DisplayText size={size} weight="500" tone={growing ? "glowInk" : "ink2"} tabular>
          {formatAmount(change, currency, locale, { signed: true })}
          {ratio !== null && (
            <DisplayText size={size} tone={growing ? "glowInk" : "ink2"} style={{ opacity: 0.6 }}>
              {"  ·  "}
            </DisplayText>
          )}
          {ratio !== null && formatPercent(ratio, locale, { signed: true })}
        </DisplayText>
      </View>
      <DisplayText size={size} tone="ink3">
        {text.hero.inThirtyDays}
      </DisplayText>
    </View>
  );
}

/** A soft halo behind the number while MRR grows on screen. */
function HeroGlow({ visible, color }: { visible: boolean; color: string }) {
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 700 }),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", left: "-12%", right: "-12%", top: "-30%", bottom: "-30%", zIndex: -1 },
        style,
      ]}
    >
      <RadialGlow color={color} opacity={0.22} />
    </Animated.View>
  );
}

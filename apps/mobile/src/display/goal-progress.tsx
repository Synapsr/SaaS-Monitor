import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { formatAmount, formatPercent } from "@/contract/display/format";
import type { RecurringMetric } from "@/contract/display/metric";
import type { GoalProgress as Progress } from "@/contract/display/milestones";
import { formatEta } from "@/contract/display/time";
import { formatMoney } from "@/contract/money";
import { useDisplay } from "@/display/context";
import { DisplayText } from "@/display/text";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface GoalProgressProps {
  /** Measured in the screen's metric, like its goal. */
  progress: Progress;
  recurring: RecurringMetric;
  currency: string;
  timeZone: string;
  now: number;
}

/** How far the next goal is: prominent enough to motivate, quiet enough to live with. */
export function GoalProgress({ progress, recurring, currency, timeZone, now }: GoalProgressProps) {
  const { locale: displayLocale, palette, scale, layout } = useDisplay();
  const { locale, text } = displayLocale;
  const percent = Math.round(progress.progress * 1000) / 10;
  const target = `${formatMoney(progress.target, currency, { compact: true, locale })} ${recurring.label}`;
  const eta = progress.eta && formatEta(progress.eta, new Date(now), timeZone, displayLocale);
  const size = layout === "wall" ? 12 : 14;

  return (
    <View style={{ gap: 8 * scale }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 * scale }}>
        <DisplayText size={size} tone="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
          {progress.kind === "goal" ? text.goal.goal : text.goal.nextMilestone}{" "}
          <DisplayText size={size} weight="600">
            {target}
          </DisplayText>
        </DisplayText>
        <DisplayText size={size} tone="ink2" tabular>
          {formatPercent(Math.floor(percent) / 100, locale)}
        </DisplayText>
      </View>
      <Bar
        progress={progress.progress}
        label={target}
        percent={percent}
        height={(layout === "wall" ? 6 : 8) * scale}
        colors={palette}
      />
      <DisplayText size={size} tone="ink2" numberOfLines={layout === "wall" ? 1 : 2}>
        <DisplayText size={size} weight="500" tabular>
          {text.goal.toGo(formatAmount(progress.remaining, currency, locale))}
        </DisplayText>
        {eta && ` · ${text.goal.atThisPace(eta)}`}
      </DisplayText>
    </View>
  );
}

interface BarProps {
  progress: number;
  label: string;
  percent: number;
  height: number;
  colors: { fill: string; glow: string; glowDeep: string; glowInk: string; screen: string };
}

/** The track, filling up from the accent's deep shade to its glow, its end lit. */
function Bar({ progress, label, percent, height, colors }: BarProps) {
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = reducedMotion
      ? progress
      : withTiming(progress, { duration: 1800, easing: Easing.out(Easing.cubic) });
  }, [progress, reducedMotion, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  const knob = height * 1.7;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={{ height, borderRadius: height, backgroundColor: colors.fill }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: height,
            experimental_backgroundImage: `linear-gradient(to right, ${colors.glowDeep}, ${colors.glow})`,
          },
          fill,
        ]}
      >
        <View
          style={{
            position: "absolute",
            right: -knob / 2,
            top: (height - knob) / 2,
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            backgroundColor: colors.glowInk,
            borderWidth: height * 0.35,
            borderColor: colors.screen,
            boxShadow: `0 0 ${knob * 1.2}px ${knob * 0.2}px ${colors.glow}`,
          }}
        />
      </Animated.View>
    </View>
  );
}

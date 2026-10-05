import { useEffect, useId, useMemo, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import { chartRangeLabel, layoutMrrChart, nearestPoint } from "@/contract/display/chart";
import { formatAmount, formatPercent, percentChange } from "@/contract/display/format";
import type { RecurringMetric } from "@/contract/display/metric";
import { formatChartDay } from "@/contract/display/time";
import type { SeriesPoint } from "@/contract/display/types";
import { formatMoney } from "@/contract/money";
import type { ChartRange } from "@/contract/screens/settings";
import { useDisplay } from "@/display/context";
import { DisplayText } from "@/display/text";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { TrendingDownIcon, TrendingUpIcon } from "@/ui/icons";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MrrChartProps {
  /** MRR history, drawn in the screen's metric. */
  series: SeriesPoint[];
  recurring: RecurringMetric;
  currency: string;
  range: ChartRange;
  /** Next goal or milestone, in minor units of the screen's metric. */
  target: number;
  /** Height of the plot, before the display's scale; without, the chart fills its column. */
  plotHeight?: number;
}

/**
 * MRR (or ARR) over the chart range: a soft area, the live end glowing, and the next goal as a
 * horizon. Touching the curve reads the value of a day.
 */
export function MrrChart({ series: mrrSeries, recurring, currency, range, target, plotHeight }: MrrChartProps) {
  const { locale: displayLocale, palette, scale, layout } = useDisplay();
  const { locale, text } = displayLocale;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const series = useMemo(
    () => mrrSeries.map(({ date, value }) => ({ date, value: recurring.fromMrr(value) })),
    [mrrSeries, recurring],
  );
  const first = series[0];
  const last = series.at(-1);
  const rangeLabel = chartRangeLabel(range, first?.date, displayLocale);
  const change = first && last ? last.value - first.value : 0;
  // Since the very first day, a percentage mostly tells how small that day was.
  const ratio = first && last && range !== "all" ? percentChange(last.value, first.value) : null;
  const Trend = change >= 0 ? TrendingUpIcon : TrendingDownIcon;
  const caption = layout === "wall" ? 11 : 13;
  const fontSize = (layout === "wall" ? 9.5 : 11) * scale;

  return (
    <View style={{ gap: 8 * scale, flex: plotHeight === undefined ? 1 : undefined, minHeight: 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 * scale }}>
        <DisplayText size={caption} tone="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
          {recurring.label}{" "}
          <DisplayText size={caption} tone="ink3">
            · {rangeLabel}
          </DisplayText>
        </DisplayText>
        {series.length > 1 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 * scale }}>
            <Trend size={caption * 1.1 * scale} color={change >= 0 ? palette.glow : palette.ink3} />
            <DisplayText size={caption} tone="ink2" tabular>
              {formatAmount(change, currency, locale, { signed: true })}
              {ratio !== null && (
                <DisplayText size={caption} tone="ink3">
                  {" · "}
                  {formatPercent(ratio, locale, { signed: true })}
                </DisplayText>
              )}
            </DisplayText>
          </View>
        )}
      </View>
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize({ width, height });
        }}
        style={
          plotHeight === undefined
            ? { flex: 1, minHeight: 44 * scale, marginBottom: fontSize * 2 }
            : { height: plotHeight * scale, marginBottom: fontSize * 2 }
        }
      >
        {series.length < 2 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <DisplayText size={caption} tone="ink3" style={{ textAlign: "center" }}>
              {text.chart.empty}
            </DisplayText>
          </View>
        ) : (
          size.width > 0 &&
          size.height > 0 && (
            <Plot
              series={series}
              title={`${recurring.label}, ${rangeLabel}`}
              currency={currency}
              target={target}
              width={size.width}
              height={size.height}
              fontSize={fontSize}
            />
          )
        )}
      </View>
    </View>
  );
}

interface PlotProps {
  series: SeriesPoint[];
  /** What the curve shows, for screen readers: "ARR, since March 2025". */
  title: string;
  currency: string;
  target: number;
  width: number;
  height: number;
  fontSize: number;
}

function Plot({ series, title, currency, target, width: fullWidth, height, fontSize }: PlotProps) {
  const { locale: displayLocale, palette, scale } = useDisplay();
  const { locale, text } = displayLocale;
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/[^a-z0-9]/gi, "");
  const [touched, setTouched] = useState<number | null>(null);
  const dot = 4.2 * scale;
  // The curve ends short of the edge, where its live end and its pulse still fit: Android draws
  // nothing outside the SVG.
  const bleed = Math.ceil(dot * 2.4);
  // Value labels longer than the gutter ("14 k $US") would leave the screen: the plot moves right.
  const { chart, offset } = useMemo(() => {
    const options = { series, currency, target, locale, height, fontSize };
    const full = layoutMrrChart({ ...options, width: fullWidth - bleed });
    const longest = Math.max(0, ...full.yTicks.map((tick) => tick.label.length));
    const overflow = Math.ceil(longest * fontSize * 0.58 - (full.gutter - fontSize * 0.9));
    return overflow > 0
      ? { chart: layoutMrrChart({ ...options, width: fullWidth - bleed - overflow }), offset: overflow }
      : { chart: full, offset: 0 };
  }, [series, currency, target, locale, fullWidth, height, fontSize, bleed]);
  const width = fullWidth - offset;

  // The curve draws itself from the left, behind a view that widens (an SVG clip path isn't
  // redrawn on Android as it changes); then its live end starts to pulse.
  const [drawn, setDrawn] = useState(false);
  const revealed = drawn || reducedMotion;
  const reveal = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    reveal.value = withTiming(1, { duration: 1600, easing: Easing.bezier(0.22, 1, 0.36, 1) }, (finished) => {
      if (finished) scheduleOnRN(setDrawn, true);
    });
  }, [reveal, reducedMotion]);
  const revealStyle = useAnimatedStyle(() => ({ width: reveal.value * width }));

  const ping = useSharedValue(0);
  useEffect(() => {
    if (!revealed || reducedMotion) return;
    ping.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.bezier(0, 0, 0.2, 1) }), -1, false);
  }, [ping, revealed, reducedMotion]);
  const pingProps = useAnimatedProps(() => ({
    r: dot * (1 + ping.value * 1.6),
    opacity: reducedMotion ? 0 : 0.55 * (1 - Math.min(1, ping.value / 0.8)),
  }));

  const start = chart.points[0];
  const end = chart.points[chart.points.length - 1];
  const summary = text.chart.summary(
    title,
    formatMoney(start.value, currency, { locale }),
    formatMoney(end.value, currency, { locale }),
  );

  // The crosshair snaps to the nearest point: readers aim at a date, not at a thin line.
  const onTouch = (event: GestureResponderEvent) =>
    setTouched(nearestPoint(chart, event.nativeEvent.locationX));
  const point = touched === null ? null : { ...chart.points[touched], day: series[touched].date };
  const endX = chart.x(end.date);
  const endY = chart.y(end.value);

  return (
    <View
      style={{ position: "absolute", left: offset, width, top: 0, bottom: 0 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={summary}
      onStartShouldSetResponder={() => true}
      onResponderGrant={onTouch}
      onResponderMove={onTouch}
      onResponderRelease={() => setTouched(null)}
      onResponderTerminate={() => setTouched(null)}
    >
      <Svg width={width} height={height} style={{ position: "absolute" }}>
        {chart.yTicks.map((tick) => (
          <Line
            key={tick.y}
            x1={chart.gutter}
            x2={width}
            y1={tick.y}
            y2={tick.y}
            stroke={palette.hairline}
            strokeWidth={1}
          />
        ))}
        {chart.horizon && (
          <Line
            x1={chart.gutter}
            x2={width}
            y1={chart.horizon.y}
            y2={chart.horizon.y}
            stroke={palette.glow}
            strokeOpacity={0.5}
            strokeDasharray={[2 * scale, 7 * scale]}
            strokeLinecap="round"
            strokeWidth={2 * scale}
          />
        )}
      </Svg>
      {/* Once drawn, a plain width: the whole curve shows, even if frames of the reveal were lost. */}
      <Animated.View
        style={[{ position: "absolute", height, overflow: "hidden" }, revealed ? { width } : revealStyle]}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={`area${id}`} x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={palette.glow} stopOpacity={0.26} />
              <Stop offset="0.7" stopColor={palette.glow} stopOpacity={0.05} />
              <Stop offset="1" stopColor={palette.glow} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={chart.areaPath} fill={`url(#area${id})`} />
          <Path
            d={chart.linePath}
            fill="none"
            stroke={palette.glow}
            strokeWidth={2.6 * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
      <Svg width={width} height={height} style={{ position: "absolute", overflow: "visible" }}>
        {point && (
          <Line
            x1={chart.x(point.date)}
            x2={chart.x(point.date)}
            y1={0}
            y2={height}
            stroke={palette.ink3}
            strokeOpacity={0.6}
            strokeWidth={1}
          />
        )}
        <AnimatedCircle cx={endX} cy={endY} fill={palette.glow} animatedProps={pingProps} />
        <Circle cx={endX} cy={endY} r={dot} fill={palette.glow} stroke={palette.screen} strokeWidth={2.4 * scale} />
      </Svg>

      {chart.yTicks.map((tick) => (
        <DisplayText
          key={tick.y}
          size={fontSize / scale}
          tone="ink3"
          tabular
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          // Right-aligned on the gutter: a long label grows to the left, as on the web.
          style={{
            position: "absolute",
            right: width - chart.gutter + fontSize * 0.9,
            top: tick.y - fontSize * 0.7,
            textAlign: "right",
          }}
        >
          {tick.label}
        </DisplayText>
      ))}
      {chart.horizon && (
        <DisplayText
          size={fontSize / scale}
          weight="500"
          tone="glowInk"
          maxFontSizeMultiplier={1}
          style={{ position: "absolute", right: 0, top: chart.horizon.y - fontSize * 1.9 }}
        >
          {text.chart.goal(chart.horizon.label)}
        </DisplayText>
      )}
      {chart.xTicks.map((tick) => (
        <DisplayText
          key={tick.x}
          size={fontSize / scale}
          tone="ink3"
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          style={{
            position: "absolute",
            top: height + fontSize * 0.5,
            left: tick.x - fontSize * 3,
            width: fontSize * 6,
            textAlign: "center",
          }}
        >
          {tick.label}
        </DisplayText>
      ))}

      {point && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: Math.max(0, chart.y(point.value) - fontSize * 5.4),
            ...(chart.x(point.date) > width / 2
              ? { right: width - chart.x(point.date) + 8 * scale }
              : { left: chart.x(point.date) + 8 * scale }),
            paddingHorizontal: 10 * scale,
            paddingVertical: 7 * scale,
            borderRadius: 12 * scale,
            backgroundColor: palette.popover,
            borderWidth: 1,
            borderColor: palette.edge,
          }}
        >
          <DisplayText size={14} weight="600" tabular maxFontSizeMultiplier={1.2}>
            {formatMoney(point.value, currency, { locale })}
          </DisplayText>
          <DisplayText size={11} tone="ink3" maxFontSizeMultiplier={1.2}>
            {formatChartDay(point.day, series[series.length - 1].date, locale)}
          </DisplayText>
        </View>
      )}
    </View>
  );
}

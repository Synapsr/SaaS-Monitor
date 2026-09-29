import { scaleLinear, scaleUtc, type ScaleLinear, type ScaleTime } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { utcDay, utcMonday, utcMonth, utcYear, type TimeInterval } from "d3-time";
import { dayToUtcDate, daysBetween } from "@/lib/display/calendar";
import type { DisplayLocale } from "@/lib/display/i18n";
import { formatAxisDate, formatMonth, type AxisUnit } from "@/lib/display/time";
import type { SeriesPoint } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";
import type { ChartRange } from "@/lib/screens/settings";

/** The goal line is drawn when the target is this close above the highest value. */
const HORIZON_REACH = 1.3;
/** Width of a date label such as "Sep 27", in font sizes, with some air around it. */
const DATE_LABEL_WIDTH = 5.5;
const MAX_DATE_TICKS = 8;
/**
 * Candidate label spacings of each unit, densest first. Weeks start on Mondays so that gaps stay
 * even, and years go by 1, 2, 5 or 10 so that labels stay round.
 */
const TICK_INTERVALS: Record<AxisUnit, (TimeInterval | null)[]> = {
  day: [utcDay, utcMonday, utcMonday.every(2)],
  month: [1, 2, 3, 6].map((step) => utcMonth.every(step)),
  year: [1, 2, 5, 10].map((step) => utcYear.every(step)),
};

/** What a chart covers: "last 90 days", or all time from its first day: "since March 2025". */
export function chartRangeLabel(
  range: ChartRange,
  firstDay: string | undefined,
  { locale, text }: DisplayLocale,
): string {
  if (range !== "all") return text.chart.ranges[range];
  return firstDay
    ? text.chart.since(formatMonth(firstDay, locale, { year: true }))
    : text.chart.allTime;
}

export interface ChartPoint {
  date: Date;
  value: number;
}

export interface MrrChartLayout {
  /** Room on the left for the value labels, so that they never sit on the curve. */
  gutter: number;
  points: ChartPoint[];
  x: ScaleTime<number, number>;
  y: ScaleLinear<number, number>;
  linePath: string;
  areaPath: string;
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
  /** The next goal as a line to reach, when it is within sight. */
  horizon: { y: number; label: string } | null;
}

interface LayoutOptions {
  /** At least two points, oldest first; a long history is sampled by week or month. */
  series: readonly SeriesPoint[];
  currency: string;
  /** Next goal or milestone, in minor units. */
  target: number;
  /** The screen's, for amounts and dates. */
  locale: string;
  width: number;
  height: number;
  /** Font size of the labels in pixels: ticks are spaced so that labels never collide. */
  fontSize: number;
}

/** Scales, paths and ticks of the MRR chart, in pixels. */
export function layoutMrrChart({
  series,
  currency,
  target,
  locale,
  width,
  height,
  fontSize,
}: LayoutOptions): MrrChartLayout {
  const points = series.map((point) => ({ date: dayToUtcDate(point.date), value: point.value }));
  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const showsTarget = target > high && target <= high * HORIZON_REACH;
  const top = showsTarget ? target : high;
  const span = top - low || top * 0.1 || 1;
  const gutter = fontSize * 3.6;

  // Headroom above for the glowing end, room below so the curve never sits on the floor.
  const y = scaleLinear()
    .domain([Math.max(0, low - span * 0.45), top + span * 0.1])
    .nice(4)
    .range([height, 0]);
  const x = scaleUtc()
    .domain([points[0].date, points[points.length - 1].date])
    .range([gutter, width]);

  const curve = line<ChartPoint>()
    .x((point) => x(point.date))
    .y((point) => y(point.value))
    .curve(curveMonotoneX);
  const fill = area<ChartPoint>()
    .x((point) => x(point.date))
    .y0(height)
    .y1((point) => y(point.value))
    .curve(curveMonotoneX);

  const unit = axisUnit(daysBetween(series[0].date, series[series.length - 1].date));
  const xTicks = dateTicks(x, TICK_INTERVALS[unit], fontSize).map((date) => ({
    x: x(date),
    label: formatAxisDate(date.toISOString().slice(0, 10), unit, locale),
  }));
  // Value labels need about three lines of room between them.
  const tickValues = y.ticks(Math.min(5, Math.max(2, Math.floor(height / (fontSize * 3.2)))));
  const labels = valueLabels(tickValues, currency, locale);
  const yTicks = tickValues
    .map((value, index) => ({ y: y(value), label: labels[index] }))
    // A label at the very top would touch the caption above the chart.
    .filter((tick) => tick.y > fontSize);

  return {
    gutter,
    points,
    x,
    y,
    linePath: curve(points) ?? "",
    areaPath: fill(points) ?? "",
    xTicks,
    yTicks,
    horizon: showsTarget
      ? { y: y(target), label: formatMoney(target, currency, { compact: true, locale }) }
      : null,
  };
}

/**
 * Index of the point nearest to a horizontal position, e.g. the pointer's. Points are sorted by
 * date but not evenly spaced when a long history is sampled.
 */
export function nearestPoint(
  { points, x }: Pick<MrrChartLayout, "points" | "x">,
  position: number,
): number {
  let before = 0;
  let after = points.length - 1;
  while (after - before > 1) {
    const middle = Math.floor((before + after) / 2);
    if (x(points[middle].date) <= position) before = middle;
    else after = middle;
  }
  return position - x(points[before].date) <= x(points[after].date) - position ? before : after;
}

/**
 * Compact amounts with the fewest decimals that tell them apart: ticks $20K apart around $1M read
 * "$1.02M" and "$1.04M", not "$1M" twice.
 */
function valueLabels(values: readonly number[], currency: string, locale: string): string[] {
  let labels: string[] = [];
  for (let digits = 1; digits <= 3; digits += 1) {
    labels = values.map((value) =>
      formatMoney(value, currency, { compact: true, compactDigits: digits, locale }),
    );
    if (new Set(labels).size === labels.length) break;
  }
  return labels;
}

/**
 * What the time axis labels, from the number of days it spans: days or weeks over a month or two,
 * months up to three years, then years, which read better than half-years by then.
 */
function axisUnit(days: number): AxisUnit {
  if (days <= 62) return "day";
  return days < 3 * 365 ? "month" : "year";
}

/**
 * Round dates to label, from the densest `intervals` whose labels fit without colliding. Labels
 * are centered on their date, so those that would stick out of the plot are left out.
 */
function dateTicks(
  x: ScaleTime<number, number>,
  intervals: readonly (TimeInterval | null)[],
  fontSize: number,
): Date[] {
  const [left, right] = x.range();
  const labelWidth = fontSize * DATE_LABEL_WIDTH;
  // A calm axis: a handful of dates is enough to read a trend from across the room.
  const fitting = Math.min(MAX_DATE_TICKS, Math.max(2, Math.floor((right - left) / labelWidth)));
  const [first, last] = x.domain();
  const candidates = intervals.flatMap((interval) =>
    interval ? [interval.range(first, new Date(last.getTime() + 1))] : [],
  );
  const dates = candidates.find((ticks) => ticks.length <= fitting) ?? candidates.at(-1) ?? [];
  // Below the plot, labels may extend under the value gutter but not past either side.
  return dates.filter((date) => {
    const position = x(date);
    return position - labelWidth / 2 >= 0 && position + labelWidth / 2 <= right;
  });
}

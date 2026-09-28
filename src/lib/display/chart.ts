import { scaleLinear, scaleUtc, type ScaleLinear, type ScaleTime } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { utcDay, utcMonday, utcMonth, type TimeInterval } from "d3-time";
import { dayToUtcDate } from "@/lib/display/calendar";
import { formatChartDay } from "@/lib/display/time";
import type { SeriesPoint } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";

/** The goal line is drawn when the target is this close above the highest value. */
const HORIZON_REACH = 1.3;
/** Width of a date label such as "Sep 27", in font sizes, with some air around it. */
const DATE_LABEL_WIDTH = 5.5;
const MAX_DATE_TICKS = 8;
/** Candidate label spacings, densest first. Weeks start on Mondays so that gaps stay even. */
const MONTH_INTERVALS = [1, 2, 3, 6].map((step) => utcMonth.every(step));
const DAY_INTERVALS = [utcDay, utcMonday, utcMonday.every(2)];

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
  /** At least two points. */
  series: readonly SeriesPoint[];
  currency: string;
  /** Next goal or milestone, in minor units. */
  target: number;
  /** Months label a long range, days a short one. */
  monthly: boolean;
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
  monthly,
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

  const xTicks = dateTicks(x, monthly, fontSize).map((date) => ({
    x: x(date),
    label: formatChartDay(date.toISOString().slice(0, 10), monthly),
  }));
  // Value labels need about three lines of room between them.
  const yTicks = y
    .ticks(Math.min(5, Math.max(2, Math.floor(height / (fontSize * 3.2)))))
    .map((value) => ({ y: y(value), label: formatMoney(value, currency, { compact: true }) }))
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
      ? { y: y(target), label: formatMoney(target, currency, { compact: true }) }
      : null,
  };
}

/**
 * Round dates to label: month starts on long ranges, days or weeks on short ones, as many as fit
 * without labels colliding. Labels are centered on their date, so those that would stick out of
 * the plot are left out.
 */
function dateTicks(x: ScaleTime<number, number>, monthly: boolean, fontSize: number): Date[] {
  const [left, right] = x.range();
  const labelWidth = fontSize * DATE_LABEL_WIDTH;
  // A calm axis: a handful of dates is enough to read a trend from across the room.
  const fitting = Math.min(MAX_DATE_TICKS, Math.max(2, Math.floor((right - left) / labelWidth)));
  const [first, last] = x.domain();
  const intervals: (TimeInterval | null)[] = monthly ? MONTH_INTERVALS : DAY_INTERVALS;
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

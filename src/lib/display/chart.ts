import { scaleLinear, scaleUtc, type ScaleLinear, type ScaleTime } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { dayToUtcDate, formatChartDay } from "@/lib/display/time";
import type { SeriesPoint } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";

/** The goal line is drawn when the target is this close above the highest value. */
const HORIZON_REACH = 1.3;

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

  // Labels need room: about eleven characters apart across, three lines apart down.
  const xTicks = x
    .ticks(Math.max(2, Math.floor((width - gutter) / (fontSize * 11))))
    .map((date) => {
      const day = date.toISOString().slice(0, 10);
      return { x: x(date), label: formatChartDay(day, monthly && day.endsWith("-01")) };
    });
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

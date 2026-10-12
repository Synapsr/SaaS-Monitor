import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";

/** A small curve of values, drawn in a box of `width` by `height` (an SVG's viewBox). */
export interface Sparkline {
  line: string;
  /** The same curve, closed down to the bottom edge, for its fill. */
  area: string;
  /** Where the curve ends, in percent of the box: its newest value gets a dot. */
  end: { x: number; y: number };
}

/** Enough for the trend of a small curve: more only draws the noise of each day. */
const MAX_POINTS = 32;

/**
 * The curve of a series of values, oldest first, evenly spaced: `null` with fewer than two. Its
 * vertical scale is the wall chart's (`layoutMrrChart`), so that both curves have the same shape:
 * room below so that the curve never sits on the floor, a little headroom above.
 */
export function sparkline(
  series: readonly number[],
  { width, height }: { width: number; height: number },
): Sparkline | null {
  if (series.length < 2) return null;
  const values = sample(series, MAX_POINTS);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || high * 0.1 || 1;
  const y = scaleLinear()
    .domain([Math.max(0, low - span * 0.45), high + span * 0.1])
    .range([height, 0]);
  const x = scaleLinear()
    .domain([0, values.length - 1])
    .range([0, width]);

  const points = values.map((value, index): [number, number] => [x(index), y(value)]);
  const [endX, endY] = points[points.length - 1];
  return {
    line: line().curve(curveMonotoneX)(points) ?? "",
    area: area().curve(curveMonotoneX).y0(height)(points) ?? "",
    end: { x: (endX / width) * 100, y: (endY / height) * 100 },
  };
}

/** At most `count` values, evenly spaced, the first and the last (today's) always among them. */
export function sample(values: readonly number[], count: number): number[] {
  if (values.length <= count) return [...values];
  const step = (values.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, index) => values[Math.round(index * step)]);
}

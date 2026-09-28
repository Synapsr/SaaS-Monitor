import { TrendingDown, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState, type PointerEvent } from "react";
import { layoutMrrChart } from "@/lib/display/chart";
import { formatAmount, formatPercent, percentChange } from "@/lib/display/format";
import { useElementSize } from "@/lib/display/hooks/use-element-size";
import { formatChartDay } from "@/lib/display/time";
import type { SeriesPoint } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";
import type { ChartRange } from "@/lib/screens/settings";
import { cn } from "@/lib/utils";

const RANGE_LABELS: Record<ChartRange, string> = {
  "30d": "last 30 days",
  "90d": "last 90 days",
  "12m": "last 12 months",
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface MrrChartProps {
  series: SeriesPoint[];
  currency: string;
  range: ChartRange;
  /** Next goal or milestone, in minor units. */
  target: number;
  className?: string;
}

/** MRR over the chart range: a soft area, the live end glowing, and the next goal as a horizon. */
export function MrrChart({ series, currency, range, target, className }: MrrChartProps) {
  const [plotRef, size] = useElementSize<HTMLDivElement>();
  const first = series[0];
  const last = series.at(-1);
  const change = first && last ? last.value - first.value : 0;
  const ratio = first && last ? percentChange(last.value, first.value) : null;
  const Trend = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <figure className={cn("flex min-h-0 flex-col gap-3", className)}>
      <figcaption className="flex items-baseline justify-between gap-6 text-lg">
        <span className="text-(--ink-2)">
          MRR <span className="text-(--ink-3)">· {RANGE_LABELS[range]}</span>
        </span>
        {series.length > 1 && (
          <span className="flex items-center gap-2 text-(--ink-2) tabular-nums">
            <Trend
              aria-hidden
              className={cn("size-[1.1em]", change >= 0 ? "text-(--glow)" : "text-(--ink-3)")}
            />
            {formatAmount(change, currency, { signed: true })}
            {ratio !== null && (
              <span className="text-(--ink-3)">· {formatPercent(ratio, { signed: true })}</span>
            )}
          </span>
        )}
      </figcaption>
      <div ref={plotRef} className="relative min-h-0 flex-1">
        {series.length < 2 ? (
          <p className="absolute inset-0 grid place-items-center text-xl text-(--ink-3)">
            The curve appears after a few days of history.
          </p>
        ) : (
          size.width > 0 &&
          size.height > 0 && (
            <Plot series={series} currency={currency} range={range} target={target} {...size} />
          )
        )}
      </div>
    </figure>
  );
}

interface PlotProps extends Omit<MrrChartProps, "className"> {
  width: number;
  height: number;
  fontSize: number;
}

function Plot({ series, currency, range, target, width, height, fontSize }: PlotProps) {
  const gradientId = useId();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const chart = useMemo(
    () =>
      layoutMrrChart({
        series,
        currency,
        target,
        monthly: range !== "30d",
        width,
        height,
        fontSize,
      }),
    [series, currency, range, target, width, height, fontSize],
  );

  const start = chart.points[0];
  const end = chart.points[chart.points.length - 1];
  const draw = reducedMotion ? { duration: 0 } : { duration: 1.6, ease: EASE_OUT };
  const morph = reducedMotion ? { duration: 0 } : { duration: 1.1, ease: EASE_OUT };
  const summary = `MRR over the ${RANGE_LABELS[range]}: from ${formatMoney(start.value, currency)} to ${formatMoney(end.value, currency)}.`;

  // The crosshair snaps to the nearest day: readers aim at a date, not at a thin line.
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - bounds.left - chart.gutter;
    const ratio = Math.min(1, Math.max(0, offset / (bounds.width - chart.gutter)));
    setHovered(Math.round(ratio * (chart.points.length - 1)));
  };
  const hoveredPoint = hovered === null ? null : chart.points[hovered];

  return (
    <div
      className="absolute inset-0"
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHovered(null)}
    >
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={summary}
        className="absolute inset-0 overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--glow)" stopOpacity={0.26} />
            <stop offset="70%" stopColor="var(--glow)" stopOpacity={0.05} />
            <stop offset="100%" stopColor="var(--glow)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {chart.yTicks.map((tick) => (
          <line
            key={tick.label}
            x1={chart.gutter}
            x2={width}
            y1={tick.y}
            y2={tick.y}
            stroke="var(--hairline)"
            strokeWidth={1}
          />
        ))}

        {chart.horizon && (
          <line
            x1={chart.gutter}
            x2={width}
            y1={chart.horizon.y}
            y2={chart.horizon.y}
            stroke="var(--glow)"
            strokeOpacity={0.5}
            strokeDasharray="2 7"
            strokeLinecap="round"
            className="[stroke-width:calc(var(--rem)*0.12)]"
          />
        )}

        {/* Paths morph when data changes; a new number of points redraws them instead. */}
        <motion.path
          key={`area-${chart.points.length}`}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0, d: chart.areaPath }}
          animate={{ opacity: 1, d: chart.areaPath }}
          transition={{ opacity: { ...draw, delay: reducedMotion ? 0 : 0.5 }, d: morph }}
        />
        <motion.path
          key={`line-${chart.points.length}`}
          fill="none"
          stroke="var(--glow)"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="[stroke-width:calc(var(--rem)*0.19)]"
          initial={{ pathLength: 0, d: chart.linePath }}
          animate={{ pathLength: 1, d: chart.linePath }}
          transition={{ pathLength: draw, d: morph }}
        />

        {hoveredPoint && (
          <line
            x1={chart.x(hoveredPoint.date)}
            x2={chart.x(hoveredPoint.date)}
            y1={0}
            y2={height}
            stroke="var(--ink-3)"
            strokeOpacity={0.6}
            strokeWidth={1}
          />
        )}

        <motion.g
          initial={{ opacity: 0, x: chart.x(end.date), y: chart.y(end.value) }}
          animate={{ opacity: 1, x: chart.x(end.date), y: chart.y(end.value) }}
          transition={{ opacity: { ...draw, delay: reducedMotion ? 0 : 1.2 }, x: morph, y: morph }}
        >
          <circle
            r={1}
            fill="var(--glow)"
            className="origin-center [r:calc(var(--rem)*0.5)] [transform-box:fill-box] motion-safe:animate-[display-ping_2.6s_cubic-bezier(0,0,0.2,1)_infinite]"
          />
          <circle
            r={1}
            fill="var(--glow)"
            stroke="var(--screen)"
            className="[stroke-width:calc(var(--rem)*0.2)] [r:calc(var(--rem)*0.42)]"
          />
        </motion.g>
      </svg>

      <div aria-hidden>
        {chart.yTicks.map((tick) => (
          <span
            key={tick.label}
            style={{ top: tick.y, width: chart.gutter - fontSize * 0.9 }}
            className="absolute left-0 -translate-y-1/2 text-right text-base text-(--ink-3) tabular-nums"
          >
            {tick.label}
          </span>
        ))}
        {chart.horizon && (
          <span
            style={{ top: chart.horizon.y }}
            className="absolute right-0 -translate-y-[125%] text-base font-medium text-(--glow-bright)"
          >
            Goal {chart.horizon.label}
          </span>
        )}
        <div className="absolute inset-x-0 top-full h-8">
          {chart.xTicks.map((tick) => (
            <span
              key={tick.x}
              style={{ left: tick.x }}
              className="absolute top-2.5 -translate-x-1/2 text-base whitespace-nowrap text-(--ink-3)"
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      {hoveredPoint && (
        <div
          style={{ left: chart.x(hoveredPoint.date), top: chart.y(hoveredPoint.value) }}
          className={cn(
            "pointer-events-none absolute -translate-y-[calc(100%+var(--rem))] rounded-xl bg-[#121418] px-4 py-2.5 whitespace-nowrap shadow-(--moment-shadow) ring-1 ring-white/10",
            chart.x(hoveredPoint.date) > width / 2 ? "-translate-x-full" : "translate-x-0",
          )}
        >
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(hoveredPoint.value, currency)}
          </p>
          <p className="text-base text-(--ink-3)">
            {formatChartDay(hoveredPoint.date.toISOString().slice(0, 10), false)}
          </p>
        </div>
      )}
    </div>
  );
}

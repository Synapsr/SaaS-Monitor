import NumberFlow from "@number-flow/react";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useDisplayLocale } from "@/hooks/use-display-locale";
import { formatAmount, formatPercent, moneyFlow, percentChange } from "@/lib/display/format";
import { recurringMetric, type RecurringMetric } from "@/lib/display/metric";
import type { DisplayMetrics } from "@/lib/display/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/** A roll slow enough to watch the digits climb, settling softly. */
const ROLL: EffectTiming = { duration: 1400, easing: "cubic-bezier(0.19, 1, 0.22, 1)" };

interface HeroProps {
  metrics: DisplayMetrics;
  /** MRR or ARR in large, the other one under it. */
  recurring: RecurringMetric;
  currency: string;
  /** The account whose numbers these are, on a screen rotating between its accounts. */
  account: string | null;
  /** Lights up (or gently dims) the number while an MRR change is being celebrated. */
  highlight: "up" | "down" | null;
}

export function Hero({ metrics, recurring, currency, account, highlight }: HeroProps) {
  const { locale, text } = useDisplayLocale();
  const value = recurring.fromMrr(metrics.mrr);
  const other = recurringMetric(recurring.other);
  // Sized from the column width and the number of characters, so that any amount fits on one line.
  const characters = formatMoney(value, currency, { locale }).length;
  return (
    <section aria-labelledby="metric-title" className="@container relative flex flex-col gap-4">
      <h2 id="metric-title" className="truncate text-2xl font-medium text-(--ink-2)">
        {account && (
          <>
            <span className="font-semibold text-(--ink)">{account}</span>
            <span aria-hidden className="text-(--ink-3)">
              {" · "}
            </span>
          </>
        )}
        {text.metricNames[recurring.metric]}
      </h2>
      <div className="relative">
        <div
          aria-hidden
          className={cn(
            "absolute -inset-x-[12%] -inset-y-[40%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow)_22%,transparent),transparent)] opacity-0 transition-opacity duration-700",
            highlight === "up" && "opacity-100",
          )}
        />
        <NumberFlow
          {...moneyFlow(value, currency, locale)}
          transformTiming={ROLL}
          spinTiming={ROLL}
          willChange
          style={{ "--characters": characters } as CSSProperties}
          className={cn(
            "hero-number relative -my-[0.125em] text-[length:min(calc(var(--rem)*11.5),calc(100cqi/(var(--characters)*0.52)))] leading-none font-semibold tracking-[-0.045em] tabular-nums transition-opacity duration-700",
            highlight === "down" && "opacity-75",
          )}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-2xl">
        <Growth
          value={value}
          before={recurring.fromMrr(metrics.mrr30DaysAgo)}
          currency={currency}
        />
        <p className="text-(--ink-3)">
          {other.label}{" "}
          <span className="font-medium text-(--ink-2) tabular-nums">
            {formatAmount(other.fromMrr(metrics.mrr), currency, locale)}
          </span>
        </p>
      </div>
    </section>
  );
}

function Growth({ value, before, currency }: { value: number; before: number; currency: string }) {
  const { locale, text } = useDisplayLocale();
  const change = value - before;
  const ratio = percentChange(value, before);
  const growing = change >= 0;
  const Icon = growing ? TrendingUpIcon : TrendingDownIcon;
  return (
    <p className="flex items-center gap-3">
      <span
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-3.5 font-medium tabular-nums",
          growing ? "bg-(--glow-wash) text-(--glow-ink)" : "bg-(--fill) text-(--ink-2)",
        )}
      >
        <Icon aria-hidden className="size-[1.1em]" strokeWidth={2.25} />
        {formatAmount(change, currency, locale, { signed: true })}
        {ratio !== null && (
          <>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            {formatPercent(ratio, locale, { signed: true })}
          </>
        )}
      </span>
      <span className="text-(--ink-3)">{text.hero.inThirtyDays}</span>
    </p>
  );
}

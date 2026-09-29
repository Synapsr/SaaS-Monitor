import { motion, useReducedMotion } from "motion/react";
import { useDisplayLocale } from "@/hooks/use-display-locale";
import { formatAmount, formatPercent } from "@/lib/display/format";
import type { RecurringMetric } from "@/lib/display/metric";
import type { GoalProgress as Progress } from "@/lib/display/milestones";
import { formatEta } from "@/lib/display/time";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

interface GoalProgressProps {
  /** Measured in the screen's metric, like its goal. */
  progress: Progress;
  recurring: RecurringMetric;
  currency: string;
  timeZone: string;
  now: number;
  className?: string;
}

/** How far the next goal is: prominent enough to motivate, quiet enough to live with. */
export function GoalProgress({
  progress,
  recurring,
  currency,
  timeZone,
  now,
  className,
}: GoalProgressProps) {
  const reducedMotion = useReducedMotion();
  const displayLocale = useDisplayLocale();
  const { locale, text } = displayLocale;
  const percent = Math.round(progress.progress * 1000) / 10;
  const target = `${formatMoney(progress.target, currency, { compact: true, locale })} ${recurring.label}`;
  const eta = progress.eta && formatEta(progress.eta, new Date(now), timeZone, displayLocale);

  return (
    <section aria-labelledby="goal-title" className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-baseline justify-between gap-6 text-xl whitespace-nowrap">
        <h2 id="goal-title">
          <span className="text-(--ink-2)">
            {progress.kind === "goal" ? text.goal.goal : text.goal.nextMilestone}
          </span>{" "}
          <span className="font-semibold">{target}</span>
        </h2>
        <p className="text-(--ink-2) tabular-nums">
          {formatPercent(Math.floor(percent) / 100, locale)}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={target}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="relative h-2.5 rounded-full bg-(--fill)"
      >
        {/* The start is the same on the server and in the browser; only the motion may differ. */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-(--glow-deep) to-(--glow)"
          initial={{ width: "0%" }}
          animate={{ width: `${percent}%` }}
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", duration: 1.8, bounce: 0 }
          }
        >
          <span className="absolute top-1/2 right-0 size-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-(--glow-ink) shadow-[0_0_calc(var(--rem)*1.2)_calc(var(--rem)*0.2)_var(--glow)] ring-[length:calc(var(--rem)*0.25)] ring-(--screen)" />
        </motion.div>
      </div>
      <p className="truncate text-xl text-(--ink-2)">
        <span className="font-medium text-(--ink) tabular-nums">
          {text.goal.toGo(formatAmount(progress.remaining, currency, locale))}
        </span>
        {eta && <> · {text.goal.atThisPace(eta)}</>}
      </p>
    </section>
  );
}

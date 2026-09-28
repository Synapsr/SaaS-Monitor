import { motion } from "motion/react";
import { Reveal } from "@/components/display/moment-card";
import { recurringMetric } from "@/lib/display/metric";
import { nextMilestone } from "@/lib/display/milestones";
import { formatMoney, toMajorUnits, toMinorUnits } from "@/lib/money";
import type { Metric } from "@/lib/screens/settings";

interface MilestoneCelebrationProps {
  /** The milestone crossed, in minor units of `metric`. */
  amount: number;
  metric: Metric;
  isGoal: boolean;
  currency: string;
}

/** The whole screen for a milestone: a moment worth stopping for, then the next one to chase. */
export function MilestoneCelebration({
  amount,
  metric,
  isGoal,
  currency,
}: MilestoneCelebrationProps) {
  const next = toMinorUnits(nextMilestone(toMajorUnits(amount, currency)), currency);
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <div className="absolute inset-0 bg-(--screen)/96" />
      <motion.div
        aria-hidden
        className="absolute size-[calc(var(--u)*150)] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow)_30%,transparent),transparent)]"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="relative flex flex-col items-center gap-7 text-center">
        <Reveal delay={0.15}>
          <p className="text-4xl font-medium text-(--glow-bright)">
            <span aria-hidden>🎉 </span>
            {isGoal ? "Goal reached" : "New milestone"}
          </p>
        </Reveal>
        <motion.p
          className="text-[length:calc(var(--rem)*15)] leading-none font-semibold tracking-[-0.05em]"
          initial={{ opacity: 0, scale: 0.7, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", duration: 1.1, bounce: 0.3, delay: 0.3 }}
        >
          {formatMoney(amount, currency, { compact: true })}
          <span className="text-[0.3em] font-medium tracking-tight text-(--ink-2)">
            {" "}
            {recurringMetric(metric).label}
          </span>
        </motion.p>
        <Reveal delay={0.75}>
          <p className="text-3xl text-(--ink-2)">
            Next stop: {formatMoney(next, currency, { compact: true })}. Keep going.
          </p>
        </Reveal>
      </div>
    </motion.div>
  );
}

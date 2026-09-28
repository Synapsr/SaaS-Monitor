import type { Metric } from "@/lib/screens/settings";

/**
 * How a screen presents recurring revenue. Display states are always in MRR, whatever the screen
 * shows: a screen set to ARR multiplies every recurring amount (MRR, its changes, the chart) by
 * twelve here, and nowhere else. Payments and revenue are cash received: they never change.
 */
export interface RecurringMetric {
  /** Written after amounts: "+$1,788 ARR". */
  label: "MRR" | "ARR";
  /** Title of the headline number. */
  name: string;
  /** The metric the headline does not show, written under it. */
  other: Metric;
  /** A monthly amount (MRR, or a change of it) in this metric. */
  fromMrr: (amount: number) => number;
}

const MONTHS_PER_YEAR = 12;

const RECURRING_METRICS: Record<Metric, RecurringMetric> = {
  mrr: {
    label: "MRR",
    name: "Monthly recurring revenue",
    other: "arr",
    fromMrr: (amount) => amount,
  },
  arr: {
    label: "ARR",
    name: "Annual recurring revenue",
    other: "mrr",
    fromMrr: (amount) => amount * MONTHS_PER_YEAR,
  },
};

/** The same object for the same metric, so that it can be a dependency of memoized values. */
export function recurringMetric(metric: Metric): RecurringMetric {
  return RECURRING_METRICS[metric];
}

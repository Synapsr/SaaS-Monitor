import type { DisplayMetrics } from "@/lib/display/types";
import { DAY } from "@/lib/display/time";
import { toMajorUnits, toMinorUnits } from "@/lib/money";

/**
 * The milestone ladder founders celebrate, in major units: 100, 250, 500, 1k, 2.5k, 5k, 10k…
 * The 1 – 2.5 – 5 pattern keeps each step motivating: close enough to reach, big enough to matter.
 */
const LADDER_STEPS = [1, 2.5, 5] as const;
const FIRST_MILESTONE = 100;

/** Ladder milestones in `(from, to]`, in major units and ascending order. */
export function milestonesBetween(from: number, to: number): number[] {
  const milestones: number[] = [];
  if (!Number.isFinite(to)) return milestones;
  for (let magnitude = FIRST_MILESTONE; magnitude <= to; magnitude *= 10) {
    for (const step of LADDER_STEPS) {
      const milestone = step * magnitude;
      if (milestone > from && milestone <= to) milestones.push(milestone);
    }
  }
  return milestones;
}

/** The first ladder milestone strictly above `value` (major units). */
export function nextMilestone(value: number): number {
  if (!Number.isFinite(value)) return FIRST_MILESTONE;
  for (let magnitude = FIRST_MILESTONE; ; magnitude *= 10) {
    for (const step of LADDER_STEPS) {
      if (step * magnitude > value) return step * magnitude;
    }
  }
}

export interface GoalProgress {
  /** `goal` while the screen's custom goal is ahead, else the next ladder milestone. */
  kind: "goal" | "milestone";
  /** Minor units, like every amount of a display. */
  target: number;
  remaining: number;
  /** Share of the target already reached, from 0 to 1. */
  progress: number;
  /** When the target is reached if MRR keeps its 30-day pace; `null` when it is not growing. */
  eta: Date | null;
}

/** Beyond this, an estimate says more about noise than about the business. */
const MAX_ETA_DAYS = 3650;

/**
 * Progress towards the next target. `goal` is the screen setting, in major units. Once the goal
 * is reached the ladder takes over, so a screen always has something to look forward to.
 */
export function goalProgress(
  metrics: Pick<DisplayMetrics, "mrr" | "mrr30DaysAgo">,
  goal: number | null,
  currency: string,
  now: Date,
): GoalProgress {
  const mrr = Math.max(0, metrics.mrr);
  const current = toMajorUnits(mrr, currency);
  const kind = goal !== null && goal > current ? "goal" : "milestone";
  const target = toMinorUnits(
    kind === "goal" && goal !== null ? goal : nextMilestone(current),
    currency,
  );
  const remaining = Math.max(0, target - mrr);

  const dailyPace = (metrics.mrr - metrics.mrr30DaysAgo) / 30;
  const days = dailyPace > 0 ? remaining / dailyPace : Infinity;
  const eta = days <= MAX_ETA_DAYS ? new Date(now.getTime() + days * DAY) : null;

  return { kind, target, remaining, progress: Math.min(1, mrr / target), eta };
}

/**
 * The milestone (minor units) crossed when MRR moved from `before` to `after`: the highest ladder
 * step or custom goal in `(before, after]`, or `null` when none was crossed.
 */
export function crossedMilestone(
  before: number,
  after: number,
  goal: number | null,
  currency: string,
): number | null {
  if (after <= before) return null;
  const from = toMajorUnits(before, currency);
  const to = toMajorUnits(after, currency);
  const candidates = milestonesBetween(from, to);
  if (goal !== null && goal > from && goal <= to) candidates.push(goal);
  return candidates.length > 0 ? toMinorUnits(Math.max(...candidates), currency) : null;
}

package com.saasmonitor.core.display

import kotlin.math.max
import kotlin.math.min

/**
 * Progress towards a screen's goal, or its next milestone once the goal is behind it
 * (`src/lib/display/milestones.ts` of the web app). Values are in the screen's metric, MRR or ARR.
 */
data class GoalProgress(
  /** `true` while the screen's own goal is ahead, `false` for a milestone of the ladder. */
  val isGoal: Boolean,
  /** Minor units, like every amount. */
  val target: Long,
  val remaining: Long,
  /** Share of the target already reached, from 0 to 1. */
  val progress: Float,
  /** When the target is reached at the 30-day pace (epoch ms); `null` when not growing. */
  val eta: Long?,
)

/** 100, 250, 500, 1k, 2.5k, 5k…: close enough to reach, big enough to matter. */
private val LADDER_STEPS = doubleArrayOf(1.0, 2.5, 5.0)
private const val FIRST_MILESTONE = 100.0
private const val DAY_MILLIS = 86_400_000L
/** Beyond this, an estimate says more about noise than about the business. */
private const val MAX_ETA_DAYS = 3650.0

/** The first ladder milestone strictly above [value] (major units). */
fun nextMilestone(value: Double): Double {
  var magnitude = FIRST_MILESTONE
  while (true) {
    for (step in LADDER_STEPS) if (step * magnitude > value) return step * magnitude
    magnitude *= 10
  }
}

/**
 * Progress of [current] (minor units, in the screen's metric) towards [goal] (major units, the
 * screen setting) or the next milestone. [thirtyDaysAgo] gives the pace for the estimate.
 */
fun goalProgress(
  current: Long,
  thirtyDaysAgo: Long,
  goal: Long?,
  currency: String,
  now: Long,
): GoalProgress {
  val reached = max(0, current)
  val reachedMajor = Money.toMajorUnits(reached, currency)
  val isGoal = goal != null && goal > reachedMajor
  val target =
    Money.toMinorUnits(if (isGoal) goal!!.toDouble() else nextMilestone(reachedMajor), currency)
  val remaining = max(0, target - reached)
  val dailyPace = (current - thirtyDaysAgo) / 30.0
  val days = if (dailyPace > 0) remaining / dailyPace else Double.POSITIVE_INFINITY
  return GoalProgress(
    isGoal = isGoal,
    target = target,
    remaining = remaining,
    progress = min(1f, reached.toFloat() / target),
    eta = if (days <= MAX_ETA_DAYS) now + (days * DAY_MILLIS).toLong() else null,
  )
}

/** Ladder milestones in `(from, to]`, in major units, ascending. */
fun milestonesBetween(from: Double, to: Double): List<Double> {
  val milestones = mutableListOf<Double>()
  var magnitude = FIRST_MILESTONE
  while (magnitude <= to) {
    for (step in LADDER_STEPS) {
      val milestone = step * magnitude
      if (milestone > from && milestone <= to) milestones += milestone
    }
    magnitude *= 10
  }
  return milestones
}

/**
 * The milestone (minor units) crossed when the value moved from [before] to [after]: the highest
 * ladder step or [goal] (major units) in between, or `null` when none was crossed.
 */
fun crossedMilestone(before: Long, after: Long, goal: Long?, currency: String): Long? {
  if (after <= before) return null
  val from = Money.toMajorUnits(before, currency)
  val to = Money.toMajorUnits(after, currency)
  val candidates = milestonesBetween(from, to).toMutableList()
  if (goal != null && goal > from && goal <= to) candidates += goal.toDouble()
  return candidates.maxOrNull()?.let { Money.toMinorUnits(it, currency) }
}

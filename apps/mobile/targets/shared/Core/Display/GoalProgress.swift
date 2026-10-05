import Foundation

/// How far the next target is (`src/lib/display/milestones.ts`): the screen's goal while it is
/// ahead, else the next milestone of the ladder, so a screen always has something to look forward
/// to. Values are in the screen's metric, like its goal.
struct GoalProgress: Sendable {
  enum Kind: Sendable {
    case goal, milestone
  }

  let kind: Kind
  /// Minor units, like every amount.
  let target: Int
  let remaining: Int
  /// Share of the target already reached, from 0 to 1.
  let progress: Double

  /// `value` in minor units; `goal` in major units, as founders type it.
  init(value: Int, goal: Int?, currency: String) {
    let reached = max(0, value)
    let current = Money.majorUnits(reached, currency: currency)
    let isGoal = goal.map { Decimal($0) > current } ?? false
    let targetMajor = isGoal ? Decimal(goal ?? 0) : Self.nextMilestone(after: current)
    kind = isGoal ? .goal : .milestone
    target = Money.minorUnits(targetMajor, currency: currency)
    remaining = max(0, target - reached)
    progress = target > 0 ? min(1, Double(reached) / Double(target)) : 1
  }

  /// The milestones founders celebrate, in major units: 100, 250, 500, 1k, 2.5k, 5k, 10k…
  private static let ladderSteps: [Decimal] = [1, 2.5, 5]
  private static let firstMilestone: Decimal = 100

  /// The first ladder milestone strictly above `value` (major units).
  static func nextMilestone(after value: Decimal) -> Decimal {
    var magnitude = firstMilestone
    while true {
      for step in ladderSteps where step * magnitude > value {
        return step * magnitude
      }
      magnitude *= 10
    }
  }
}

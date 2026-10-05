import Foundation

/// A screen's numbers as widgets and the watch present them: in its metric (MRR or ARR), its
/// currency and its language, like the wall's hero, goal and feed.
struct ScreenFigures: Sendable {
  let name: String
  let status: DisplayState.Status
  let metric: ScreenSettings.Metric
  let format: ScreenFormat
  let style: ScreenStyle
  /// MRR, or ARR, in minor units.
  let value: Int
  let valueThirtyDaysAgo: Int
  let revenueToday: Int
  let goal: GoalProgress
  /// Most recent first.
  let feed: [FeedItem]

  init(_ state: DisplayState) {
    let settings = state.screen.settings
    name = state.screen.name
    status = state.status
    metric = settings.metric
    format = ScreenFormat(currency: state.currency, language: settings.language, timeZone: settings.timeZone)
    style = ScreenStyle(accent: settings.accent, theme: settings.theme)
    value = metric.fromMrr(state.metrics.mrr)
    valueThirtyDaysAgo = metric.fromMrr(state.metrics.mrr30DaysAgo)
    revenueToday = state.metrics.revenue.today
    goal = GoalProgress(value: value, goal: settings.goal, currency: state.currency)
    feed = state.feed
  }

  var text: DisplayText { format.text }

  var change: Int { value - valueThirtyDaysAgo }
  var isGrowing: Bool { change >= 0 }
  /// Relative change in 30 days, or `nil` when there is nothing to compare with.
  var growth: Double? {
    valueThirtyDaysAgo > 0 ? Double(change) / Double(valueThirtyDaysAgo) : nil
  }

  var valueText: String { format.amount(value) }
  var compactValueText: String { format.amount(value, compact: true) }
  /// "+$1,020 · +8.9%", as the wall's growth badge.
  var growthText: String {
    [format.amount(change, signed: true), growth.map { format.percent($0, signed: true) }]
      .compactMap(\.self)
      .joined(separator: " · ")
  }
  var growthPercentText: String? { growth.map { format.percent($0, signed: true) } }
  var revenueTodayText: String { format.amount(revenueToday) }

  var goalTitle: String { goal.kind == .goal ? text.goal : text.nextMilestone }
  /// "$15K MRR".
  var goalTargetText: String { "\(format.amount(goal.target, compact: true)) \(metric.label)" }
  /// Floored, as the wall does: "99%" until the goal is really reached.
  var goalPercentText: String {
    let percent = (goal.progress * 1000).rounded() / 10
    return format.percent(percent.rounded(.down) / 100)
  }
  var goalRemainingText: String { text.toGo(format.amount(goal.remaining)) }

  var hasNumbers: Bool { status == .ready }

  /// What shows instead of the numbers, when the screen has none yet.
  var statusMessage: String? {
    switch status {
    case .ready: nil
    case .empty: text.status.empty
    case .importing: text.status.importing
    case .error: text.status.failing
    }
  }
}

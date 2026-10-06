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
  /// The curve of the screen's chart in its metric, oldest first; empty without history.
  let series: [Int]
  let revenueToday: Int
  let revenueYesterday: Int
  let monthToDate: Int
  /// The same days of the previous month; `nil` for a state cached before it was read.
  let previousMonthToDate: Int?
  let goal: GoalProgress
  /// Most recent first.
  let feed: [FeedItem]
  /// When the server computed these numbers: "today" and "this month" are its.
  let generatedAt: Date

  init(_ state: DisplayState) {
    let settings = state.screen.settings
    let revenue = state.metrics.revenue
    name = state.screen.name
    status = state.status
    metric = settings.metric
    format = ScreenFormat(currency: state.currency, language: settings.language, timeZone: settings.timeZone)
    style = ScreenStyle(accent: settings.accent, theme: settings.theme)
    value = metric.fromMrr(state.metrics.mrr)
    valueThirtyDaysAgo = metric.fromMrr(state.metrics.mrr30DaysAgo)
    series = (state.series?.mrr ?? []).map { [metric = settings.metric] in metric.fromMrr($0.value) }
    revenueToday = revenue.today
    revenueYesterday = revenue.yesterday
    monthToDate = revenue.monthToDate
    previousMonthToDate = revenue.previousMonthToDate
    goal = GoalProgress(value: value, valueThirtyDaysAgo: valueThirtyDaysAgo, goal: settings.goal, currency: state.currency)
    feed = state.feed
    generatedAt = state.generatedAt
  }

  var text: DisplayText { format.text }

  var change: Int { value - valueThirtyDaysAgo }
  var trend: Trend { Trend(change) }
  /// Relative change in 30 days, or `nil` when there is nothing to compare with.
  var growth: Double? {
    valueThirtyDaysAgo > 0 ? Double(change) / Double(valueThirtyDaysAgo) : nil
  }

  var compactValueText: String { format.amount(value, compact: true) }
  var growthPercentText: String? { growth.map { format.percent($0, signed: true) } }
  /// The growth chip's figure: the percentage, or the change itself when there is nothing to
  /// compare with.
  var deltaText: String {
    if change == 0 { return format.percent(0) }
    return growthPercentText ?? format.amount(change, signed: true, compact: true)
  }
  /// Where an arrow already says which way: "1.2%".
  var unsignedDeltaText: String {
    if change == 0 { return format.percent(0) }
    return growth.map { format.percent(abs($0)) } ?? format.amount(abs(change), compact: true)
  }
  /// "$980 yesterday".
  var revenueYesterdayText: String { text.yesterdayAmount(format.amount(revenueYesterday)) }

  /// How this month compares with the same days of the previous one, as the wall's tile.
  var monthChange: Double? {
    guard let previous = previousMonthToDate, previous > 0 else { return nil }
    return Double(monthToDate - previous) / Double(previous)
  }
  var monthChangeText: String? { monthChange.map { format.percent($0, signed: true) } }
  /// "vs September", after the change; "vs $0 in September" when that month brought nothing.
  var versusText: String? {
    guard previousMonthToDate != nil else { return nil }
    let month = format.previousMonthName(of: generatedAt)
    return monthChange == nil ? text.versusAmount(format.amount(0), month) : text.versus(month)
  }

  var goalTitle: String { goal.kind == .goal ? text.goal : text.nextMilestone }
  /// "$15K MRR".
  var goalTargetText: String { "\(format.amount(goal.target, compact: true)) \(metric.label)" }
  /// Floored, as the wall does: "99%" until the goal is really reached.
  var goalPercentText: String {
    let percent = (goal.progress * 1000).rounded() / 10
    return format.percent(percent.rounded(.down) / 100)
  }
  var goalRemainingText: String { text.toGo(format.amount(goal.remaining)) }
  /// "at this pace: Dec 14", when the value grows.
  var goalEtaText: String? {
    goal.daysLeft.map { text.atThisPace(format.eta(inDays: $0, from: generatedAt)) }
  }

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

/// Which way a number moved.
enum Trend: Sendable {
  case up, flat, down

  init(_ change: some BinaryInteger) {
    self = change > 0 ? .up : change < 0 ? .down : .flat
  }

  init(_ change: Double) {
    self = change > 0 ? .up : change < 0 ? .down : .flat
  }
}

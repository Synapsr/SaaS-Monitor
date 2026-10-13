import Foundation

/// The words widgets and the watch show of a screen, in its language. Most are the wall's
/// (`src/lib/display/i18n/en.ts`); keep them in step.
struct DisplayText: Sendable {
  /// Numbers just fetched, as the wall's top bar says.
  let live: String
  let inThirtyDays: String
  /// Not on the wall: the period of the growth chip, where "in 30 days" is too long. CLDR's
  /// narrow unit, as Wear OS writes it: "30d", "30j", "30 T.".
  let thirtyDays: String
  let goal: String
  let nextMilestone: String
  let toGo: @Sendable (String) -> String
  /// When the target is reached at the pace of the last 30 days: "at this pace: Dec 14".
  let atThisPace: @Sendable (String) -> String
  /// When a target is reached, in lowercase; `today` also titles today's numbers.
  let today: String
  let tomorrow: String
  let revenueToday: String
  /// Under today's revenue: "$980 yesterday".
  let yesterdayAmount: @Sendable (String) -> String
  let thisMonth: String
  /// After how this month compares with the previous one: "+8% vs September".
  let versus: @Sendable (String) -> String
  /// When the previous month brought nothing: "vs $0 in September".
  let versusAmount: @Sendable (String, String) -> String
  let latestActivity: String
  /// Not on the wall, whose feed explains what will appear: a widget has room for a few words.
  let noActivity: String
  let kinds: Kinds
  let churnReasons: ChurnReasons
  /// A payment made for one of the account's Stripe Connect accounts: Stripe's own name.
  let connectPayment: String
  let justNow: String
  let minutesAgo: @Sendable (Int) -> String
  let hoursAgo: @Sendable (Int) -> String
  let yesterday: String
  let status: Status

  struct Kinds: Sendable {
    let payment: String
    let customer: String
    let new: String
    let expansion: String
    let reactivation: String
    let contraction: String
    let churn: String
  }

  /// Why a subscription stopped counting, when it was not simply canceled.
  struct ChurnReasons: Sendable {
    let scheduled: String
    let unpaid: String
    let paused: String
  }

  /// What shows instead of the numbers.
  struct Status: Sendable {
    let importing: String
    let failing: String
    let empty: String
    let gone: String
    let locked: String
    /// Not on the wall: the instance can't be reached, and no numbers are known yet.
    let offline: String
  }
}

extension DisplayText {
  static let en = DisplayText(
    live: "Live",
    inThirtyDays: "in 30 days",
    thirtyDays: "30d",
    goal: "Goal",
    nextMilestone: "Next milestone",
    toGo: { "\($0) to go" },
    atThisPace: { "at this pace: \($0)" },
    today: "today",
    tomorrow: "tomorrow",
    revenueToday: "Revenue today",
    yesterdayAmount: { "\($0) yesterday" },
    thisMonth: "This month",
    versus: { "vs \($0)" },
    versusAmount: { "vs \($0) in \($1)" },
    latestActivity: "Latest activity",
    noActivity: "No activity yet",
    kinds: Kinds(
      payment: "Payment",
      customer: "New customer",
      new: "New subscription",
      expansion: "Upgrade",
      reactivation: "Reactivation",
      contraction: "Downgrade",
      churn: "Cancellation"
    ),
    churnReasons: ChurnReasons(scheduled: "Won’t renew", unpaid: "Payment failed", paused: "Paused"),
    connectPayment: "Connect",
    justNow: "just now",
    minutesAgo: { "\($0) min ago" },
    hoursAgo: { "\($0) h ago" },
    yesterday: "yesterday",
    status: Status(
      importing: "Importing your Stripe history…",
      failing: "Stripe data can’t be loaded right now",
      empty: "Connect Stripe to bring this screen to life",
      gone: "This screen link no longer works",
      locked: "This screen is protected",
      offline: "This screen can’t be loaded right now"
    )
  )
}

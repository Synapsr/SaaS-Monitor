import Foundation

/// Something worth a card, on the wrist or beside the notch (`Moment` in
/// `src/lib/display/moments.ts`).
enum Moment: Sendable {
  case payment(FeedItem)
  case movement(FeedItem)
  /// A Stripe customer created, who has not paid (yet).
  case customer(FeedItem)
  /// Many things of an account at once, e.g. after the app was away: celebrated once.
  case summary(Summary)
  /// In minor units of `metric`, the screen's metric when it was crossed: "$1M ARR".
  case milestone(amount: Int, metric: ScreenSettings.Metric, isGoal: Bool)
  /// The dashboard's "Send a test celebration".
  case test(id: String)

  struct Summary: Sendable {
    let id: String
    let accountId: String
    /// The events of the items it sums up, each once: it plays when one of them does.
    let events: [ScreenEvent]
    let payments: Int
    /// Subscription changes: new, upgraded, downgraded, canceled…
    let changes: Int
    let customers: Int
    let revenue: Int
    let mrrChange: Int
  }

  var id: String {
    switch self {
    case .payment(let item), .movement(let item), .customer(let item): item.id
    case .summary(let summary): summary.id
    case .milestone(let amount, let metric, _): "milestone:\(metric.rawValue):\(amount)"
    case .test(let id): "test:\(id)"
    }
  }

  /// The account it comes from; `nil` for the total, or for no account in particular.
  var accountId: String? {
    switch self {
    case .payment(let item), .movement(let item), .customer(let item): item.accountId
    case .summary(let summary): summary.accountId
    case .milestone, .test: nil
    }
  }
}

/// What can happen on a screen, each shown as the screen's settings say (`events.ts`).
enum ScreenEvent: String, Sendable {
  case payment, connectPayment, subscription, upgrade, reactivation, downgrade, cancellation
  case unpaid, customer, milestone

  init(_ item: FeedItem) {
    switch item.kind {
    case .payment: self = item.connect == nil ? .payment : .connectPayment
    case .customer: self = .customer
    case .new: self = .subscription
    case .expansion: self = .upgrade
    case .reactivation: self = .reactivation
    case .contraction: self = .downgrade
    // A failed payment is no customer leaving.
    case .churn: self = item.churn?.reason == .unpaid ? .unpaid : .cancellation
    }
  }
}

extension ScreenSettings {
  /// Whether the screen shows `event` as a moment: on the wall, a card.
  func showsMoment(_ event: ScreenEvent) -> Bool {
    events[event.rawValue]?.moment ?? true
  }
}

extension FeedItem {
  var isMrrIncrease: Bool { kind == .new || kind == .expansion || kind == .reactivation }

  /// What it brings the account: a payment's amount, or the fee of one made for a Stripe Connect
  /// account, whose money is theirs.
  var ownRevenue: Int { connect.map { $0.applicationFee ?? 0 } ?? amount }
}

import Foundation

/// Turns fresh feed items into moments, played in the order things happened (`planMoments` in
/// `src/lib/display/moments.ts`). Each account is planned on its own.
enum MomentPlanner {
  /// From this many moments of an account at once, celebrate once with a summary.
  static let burstSize = 4

  /// A payment, a subscription change and the creation of the same customer within this delay go
  /// together: Stripe Checkout creates all three at once.
  static let sameCheckout: TimeInterval = 10 * 60

  /// `fresh` oldest first.
  static func plan(_ fresh: [FeedItem]) -> [Moment] {
    var accounts: [String] = []
    var byAccount: [String: [FeedItem]] = [:]
    for item in fresh {
      if byAccount[item.accountId] == nil { accounts.append(item.accountId) }
      byAccount[item.accountId, default: []].append(item)
    }
    let groups = accounts.flatMap { planAccount(byAccount[$0] ?? []) }
    // Stable: the groups of one account keep their order.
    return groups.enumerated()
      .sorted { ($0.element.at, $0.offset) < ($1.element.at, $1.offset) }
      .flatMap(\.element.moments)
  }

  /// Whether a payment started or grew a subscription: made by its customer around the same time,
  /// and not for a Stripe Connect account.
  static func startedBy(_ movement: FeedItem, payment: FeedItem) -> Bool {
    payment.connect == nil && isSameCheckout(payment, movement)
  }

  private struct Group {
    let at: Date
    let moments: [Moment]
  }

  /// A new subscription usually arrives with its first payment and the creation of its customer:
  /// the subscription is announced first, then the payment that started it, while the customer's
  /// creation goes without saying.
  private static func planAccount(_ items: [FeedItem]) -> [Group] {
    let payments = items.filter { $0.kind == .payment }
    let customers = items.filter { $0.kind == .customer }
    let movements = items.filter { $0.kind != .payment && $0.kind != .customer }

    var paidWith: [String: FeedItem] = [:]
    var paid: Set<String> = []
    for movement in movements where movement.isMrrIncrease {
      let candidates = payments.filter { !paid.contains($0.id) && startedBy(movement, payment: $0) }
      let distance = { (payment: FeedItem) in abs(payment.occurredAt.timeIntervalSince(movement.occurredAt)) }
      guard let payment = candidates.min(by: { distance($0) < distance($1) }) else { continue }
      paidWith[movement.id] = payment
      paid.insert(payment.id)
    }
    let celebrated = payments + movements.filter(\.isMrrIncrease)
    let absorbed = Set(
      customers.filter { customer in celebrated.contains { isSameCheckout($0, customer) } }.map(\.id)
    )

    let groups = items.compactMap { item -> Group? in
      if paid.contains(item.id) || absorbed.contains(item.id) { return nil }
      switch item.kind {
      case .payment:
        return Group(at: item.occurredAt, moments: [.payment(item)])
      case .customer:
        return Group(at: item.occurredAt, moments: [.customer(item)])
      default:
        guard let payment = paidWith[item.id] else {
          return Group(at: item.occurredAt, moments: [.movement(item)])
        }
        return Group(at: min(item.occurredAt, payment.occurredAt), moments: [.movement(item), .payment(payment)])
      }
    }
    guard groups.count >= burstSize, let last = items.last else { return groups }

    let summary = Moment.Summary(
      id: "summary:\(last.id)",
      accountId: last.accountId,
      events: items.map(ScreenEvent.init).reduce(into: []) { events, event in
        if !events.contains(event) { events.append(event) }
      },
      payments: payments.count,
      changes: movements.count,
      customers: customers.count,
      revenue: payments.reduce(0) { $0 + $1.ownRevenue },
      mrrChange: movements.reduce(0) { $0 + $1.ownRevenue }
    )
    let at = items.map(\.occurredAt).max() ?? last.occurredAt
    return [Group(at: at, moments: [.summary(summary)])]
  }

  /// Matches on the customer's key: a payment's name and country come from the charge, which may
  /// differ from the Stripe customer's.
  private static func isSameCheckout(_ a: FeedItem, _ b: FeedItem) -> Bool {
    guard let key = a.customerKey, key == b.customerKey else { return false }
    return abs(a.occurredAt.timeIntervalSince(b.occurredAt)) <= sameCheckout
  }
}

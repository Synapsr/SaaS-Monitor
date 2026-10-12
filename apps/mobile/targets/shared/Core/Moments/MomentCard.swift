import Foundation

/// What a moment's card says, in the screen's language (`describe` in `moment-overlay.tsx`).
struct MomentCard: Identifiable, Sendable {
  let id: String
  let symbol: String
  let title: String
  /// An amount, its currency symbol marked for the hero to set it smaller, or the name of a new
  /// customer.
  let headline: AttributedString
  let headlineIsName: Bool
  /// For a change of recurring revenue rather than money received: "+$99 MRR".
  let metricLabel: String?
  /// The screen it happened on.
  let screenName: String
  /// The screen's language's, for its labels.
  let locale: Locale
  /// The account it comes from, on a screen showing several.
  let account: String?
  let details: [String]
  let footnote: String?
  /// Losses are honest, never alarming: no glow, no color.
  let isCelebration: Bool
  /// A goal or a milestone crossed: its ring fills up.
  let isMilestone: Bool
  let style: ScreenStyle

  init(_ moment: Moment, state: DisplayState) {
    let figures = ScreenFigures(state)
    let format = figures.format
    let text = format.language.momentText
    let metric = figures.metric
    let change = { (mrr: Int) in format.amount(metric.fromMrr(mrr), signed: true) }
    let changeParts = { (mrr: Int) in format.attributedAmount(metric.fromMrr(mrr), signed: true) }

    id = moment.id
    style = figures.style.onDark
    screenName = state.screen.name
    locale = format.locale
    isMilestone = { if case .milestone = moment { true } else { false } }()
    account = state.accounts.count < 2 ? nil : state.accounts.first { $0.id == moment.accountId }?.name
    headlineIsName = { if case .customer = moment { true } else { false } }()

    switch moment {
    case .payment(let item):
      symbol = item.symbol
      title = item.connect == nil ? text.payment : text.connectPayment
      headline = format.attributedPayment(item.amount)
      metricLabel = nil
      details = Self.context(of: item, format: format)
      footnote = item.connect?.applicationFee.map { text.connectFee(format.payment($0)) }
      isCelebration = true
    case .movement(let item):
      symbol = item.symbol
      title = Self.title(of: item, text: text)
      headline = changeParts(item.amount)
      metricLabel = metric.label
      details = Self.context(of: item, format: format)
      footnote = Self.churnFootnote(of: item, format: format, text: text)
      isCelebration = item.isMrrIncrease
    case .customer(let item):
      let name = item.customerLabel
      let country = Self.country(of: item, format: format)
      symbol = item.symbol
      title = text.customer
      headline = AttributedString(name ?? country ?? text.someoneNew)
      metricLabel = nil
      details = name != nil ? [country].compactMap(\.self) : []
      let today = state.metrics.customersCreatedToday
      footnote = today > 0 ? text.customersToday(today) : nil
      isCelebration = true
    case .summary(let summary):
      let received = summary.revenue > 0
      symbol = "dollarsign"
      title = text.catchingUp
      headline = received ? format.attributedPayment(summary.revenue) : changeParts(summary.mrrChange)
      metricLabel = received ? nil : metric.label
      details = [
        summary.payments > 0 ? text.payments(summary.payments) : nil,
        summary.changes > 0 ? text.changes(summary.changes) : nil,
        summary.customers > 0 ? text.customers(summary.customers) : nil,
      ].compactMap(\.self)
      footnote = received && summary.mrrChange != 0 ? "\(change(summary.mrrChange)) \(metric.label)" : nil
      isCelebration = received || summary.mrrChange >= 0
    case .test:
      symbol = "party.popper"
      title = text.test
      headline = format.attributedPayment(Self.testPaymentAmount(state))
      metricLabel = nil
      details = [text.testDetails]
      footnote = nil
      isCelebration = true
    case .milestone(let amount, let milestoneMetric, let isGoal):
      symbol = "party.popper"
      title = isGoal ? text.goalReached : text.milestoneReached
      headline = format.attributedAmount(amount, compact: true)
      metricLabel = milestoneMetric.label
      details = []
      footnote = nil
      isCelebration = true
    }
  }

  private static func title(of item: FeedItem, text: MomentText) -> String {
    switch item.churn?.reason {
    case .scheduled: return text.scheduled
    case .unpaid: return text.unpaid
    case .paused: return text.paused
    case .canceled, nil: break
    }
    return switch item.kind {
    case .payment: text.payment
    case .customer: text.customer
    case .new: text.new
    case .expansion: text.expansion
    case .reactivation: text.reactivation
    case .contraction: text.contraction
    case .churn: text.churn
    }
  }

  /// Who and what: the customer (when the screen shows names), the plan, the country.
  private static func context(of item: FeedItem, format: ScreenFormat) -> [String] {
    [item.customerLabel, item.planName, country(of: item, format: format)].compactMap(\.self)
  }

  /// "🇫🇷 France", in the screen's language.
  private static func country(of item: FeedItem, format: ScreenFormat) -> String? {
    guard let code = item.country else { return nil }
    let name = format.locale.localizedString(forRegionCode: code) ?? code
    return [item.flag, name].compactMap(\.self).joined(separator: " ")
  }

  /// When a subscription set not to renew ends, or that Stripe's retries of an unpaid one ran out.
  private static func churnFootnote(of item: FeedItem, format: ScreenFormat, text: MomentText) -> String? {
    switch item.churn?.reason {
    case .scheduled:
      return item.churn?.endsAt.map {
        text.endsOn($0.formatted(Date.FormatStyle(locale: format.locale, timeZone: format.timeZone).month(.wide).day()))
      }
    case .unpaid:
      return text.unpaidDetails
    default:
      return nil
    }
  }

  /// A test celebration plays a typical payment of the screen: its ARPU, else $49.
  private static func testPaymentAmount(_ state: DisplayState) -> Int {
    let arpu = Money.majorUnits(state.metrics.arpu, currency: state.currency)
    var rounded = Decimal()
    var value = arpu
    NSDecimalRound(&rounded, &value, 0, .plain)
    let typical = arpu > 0 ? max(1, rounded) : 49
    return Money.minorUnits(typical, currency: state.currency)
  }
}

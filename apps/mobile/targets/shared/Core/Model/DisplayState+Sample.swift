import Foundation

/// A believable screen, for placeholders, the widget gallery and previews.
extension DisplayState {
  static func sample(
    name: String = "Acme",
    metric: ScreenSettings.Metric = .mrr,
    accent: String = "emerald",
    theme: ScreenSettings.Theme = .dark,
    language: Language = .en,
    currency: String = "usd",
    status: Status = .ready,
    now: Date = .now
  ) -> DisplayState {
    var settings = ScreenSettings()
    settings.currency = currency
    settings.metric = metric
    settings.goal = metric == .arr ? 200_000 : 15_000
    settings.accent = accent
    settings.theme = theme
    settings.language = language
    func item(_ id: String, _ kind: FeedItem.Kind, _ amount: Int, minutesAgo: Double, customer: String?, country: String?, plan: String?) -> FeedItem {
      FeedItem(
        id: "sample:\(id)",
        kind: kind,
        amount: amount,
        occurredAt: now.addingTimeInterval(-minutesAgo * 60),
        customerName: customer,
        customerEmail: nil,
        country: country,
        planName: plan,
        connect: nil,
        churn: kind == .churn ? FeedItem.Churn(reason: .canceled) : nil,
        accountName: name
      )
    }
    return DisplayState(
      generatedAt: now,
      screen: Screen(name: name, settings: settings),
      currency: currency,
      status: status,
      metrics: DisplayMetrics(
        mrr: 12_480_00,
        mrr30DaysAgo: 11_460_00,
        activeCustomers: 214,
        revenue: .init(today: 1_245_00, yesterday: 980_00, monthToDate: 6_120_00)
      ),
      feed: [
        item("1", .payment, 49_00, minutesAgo: 4, customer: "Jane Cooper", country: "US", plan: "Pro"),
        item("2", .new, 99_00, minutesAgo: 38, customer: "Lumen Labs", country: "FR", plan: "Team"),
        item("3", .customer, 0, minutesAgo: 95, customer: nil, country: "DE", plan: nil),
        item("4", .churn, -29_00, minutesAgo: 260, customer: "Wade Warren", country: "GB", plan: "Starter"),
      ]
    )
  }
}

extension SharedScreen {
  static let sample = SharedScreen(
    key: "0123456789abcdef",
    name: "Acme",
    baseUrl: "https://saas-monitor.com",
    token: "sample",
    accessProof: nil
  )
}

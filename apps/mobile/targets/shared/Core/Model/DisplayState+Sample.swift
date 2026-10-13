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
        live: true,
        customerKey: customer.map { "sample:\($0)" },
        customerName: customer,
        customerEmail: nil,
        country: country,
        planName: plan,
        connect: nil,
        customerSubscribed: kind == .payment ? true : nil,
        churn: kind == .churn ? FeedItem.Churn(reason: .canceled, endsAt: nil) : nil,
        accountId: "sample",
        accountName: name
      )
    }
    return DisplayState(
      generatedAt: now,
      screen: Screen(name: name, settings: settings),
      currency: currency,
      status: status,
      accounts: [Account(id: "sample", name: name)],
      metrics: DisplayMetrics(
        mrr: 12_480_00,
        mrr30DaysAgo: 11_460_00,
        activeCustomers: 214,
        arpu: 58_32,
        customersCreatedToday: 3,
        revenue: .init(today: 1_245_00, yesterday: 980_00, monthToDate: 6_120_00, previousMonthToDate: 5_480_00)
      ),
      series: Series(mrr: sampleCurve(to: 12_480_00, now: now)),
      feed: [
        item("1", .payment, 49_00, minutesAgo: 4, customer: "Jane Cooper", country: "US", plan: "Pro"),
        item("2", .new, 99_00, minutesAgo: 38, customer: "Lumen Labs", country: "FR", plan: "Team"),
        item("3", .customer, 0, minutesAgo: 95, customer: nil, country: "DE", plan: nil),
        item("4", .churn, -29_00, minutesAgo: 260, customer: "Wade Warren", country: "GB", plan: "Starter"),
      ],
      testEvent: nil,
      personalizedVoice: false
    )
  }
}

/// Ninety days of MRR rising to `last`, with the dips and plateaus of a real business.
private func sampleCurve(to last: Int, now: Date) -> [DisplayState.SeriesPoint] {
  let days = 90
  let calendar = Calendar(identifier: .gregorian)
  let format = Date.ISO8601FormatStyle().year().month().day()
  return (0..<days).map { index in
    let progress = Double(index) / Double(days - 1)
    let wave = sin(progress * 11) * 0.025 + sin(progress * 29) * 0.012
    let value = Double(last) * (0.78 + 0.22 * progress + wave * (1 - progress))
    let date = calendar.date(byAdding: .day, value: index - days + 1, to: now) ?? now
    return DisplayState.SeriesPoint(date: date.formatted(format), value: index == days - 1 ? last : Int(value))
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

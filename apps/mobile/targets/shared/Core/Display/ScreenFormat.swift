import Foundation

/// How a screen writes amounts, percentages and times: in its currency, its language and its time
/// zone, like the wall (`src/lib/display/format.ts`, `time.ts`).
struct ScreenFormat: Sendable {
  let currency: String
  let language: Language
  let timeZone: TimeZone

  var locale: Locale { language.locale }
  var text: DisplayText { language.text }

  init(currency: String, language: Language, timeZone: String) {
    self.currency = currency
    self.language = language
    self.timeZone = TimeZone(identifier: timeZone) ?? .gmt
  }

  /// Exact up to a million, compact beyond (`$1.2M`) so they stay glanceable; or compact anyway,
  /// for the smallest places (`$12.5K`).
  func amount(_ amount: Int, signed: Bool = false, compact: Bool = false, cents: Bool = false) -> String {
    Money.majorUnits(amount, currency: currency)
      .formatted(currencyStyle(amount, signed: signed, compact: compact, cents: cents))
  }

  /// `amount(_:signed:compact:cents:)`, the same characters, with its currency symbol marked
  /// (`numberSymbol == .currency`), before or after the digits: a hero sets it smaller.
  func attributedAmount(_ amount: Int, signed: Bool = false, compact: Bool = false, cents: Bool = false) -> AttributedString {
    Money.majorUnits(amount, currency: currency)
      .formatted(currencyStyle(amount, signed: signed, compact: compact, cents: cents).attributed)
  }

  private func currencyStyle(_ amount: Int, signed: Bool, compact: Bool, cents: Bool) -> Decimal.FormatStyle.Currency {
    let major = Money.majorUnits(amount, currency: currency)
    var style = Decimal.FormatStyle.Currency(code: currency.uppercased(), locale: locale)
    if compact || abs(major) >= 1_000_000 {
      style = style.notation(.compactName).precision(.fractionLength(0...1))
    } else {
      style = style.precision(.fractionLength(cents ? Money.minorUnitDigits(currency) : 0))
    }
    if signed { style = style.sign(strategy: .always(showZero: false)) }
    return style
  }

  /// A bare compact number, where even a currency symbol is too much: "12.5K".
  func compactNumber(_ amount: Int) -> String {
    Money.majorUnits(amount, currency: currency).formatted(
      Decimal.FormatStyle(locale: locale).notation(.compactName).precision(.fractionLength(0...1))
    )
  }

  /// A payment shows its cents only when it has some: `$49` but `$49.99`.
  func payment(_ amount: Int) -> String {
    self.amount(amount, cents: hasCents(amount))
  }

  func attributedPayment(_ amount: Int) -> AttributedString {
    attributedAmount(amount, cents: hasCents(amount))
  }

  private func hasCents(_ amount: Int) -> Bool {
    amount % Int(pow(10, Double(Money.minorUnitDigits(currency)))) != 0
  }

  /// "+9.9%", "−3%", "+120%": one decimal only when it carries information.
  func percent(_ ratio: Double, signed: Bool = false) -> String {
    let decimals = abs(ratio) < 0.1 ? 1 : 0
    var style = FloatingPointFormatStyle<Double>.Percent(locale: locale)
      .precision(.fractionLength(0...decimals))
    if signed { style = style.sign(strategy: .always(includingZero: false)) }
    return ratio.formatted(style)
  }

  /// When a feed item happened, for a narrow column: "just now", "5 min ago", "3 h ago",
  /// "yesterday", "Mon", then "Sep 12".
  func feedTime(_ date: Date, now: Date) -> String {
    let elapsed = max(0, now.timeIntervalSince(date))
    if elapsed < 45 { return text.justNow }
    if elapsed < 3600 { return text.minutesAgo(max(1, Int((elapsed / 60).rounded()))) }

    let age = calendar.dateComponents([.day], from: calendar.startOfDay(for: date), to: calendar.startOfDay(for: now)).day ?? 0
    if age == 0 || elapsed < 6 * 3600 { return text.hoursAgo(Int(elapsed / 3600)) }
    if age == 1 { return text.yesterday }
    if age < 7 { return date.formatted(dateStyle.weekday(.abbreviated)) }
    let sameYear = calendar.component(.year, from: date) == calendar.component(.year, from: now)
    let day = dateStyle.month(.abbreviated).day()
    return date.formatted(sameYear ? day : day.year())
  }

  /// When numbers were fetched, for a discreet timestamp: "14:05", or "Oct 3, 14:05" another day.
  /// In the device's time zone: it says when this device last heard from the screen.
  func fetchTime(_ date: Date, now: Date) -> String {
    let style = Date.FormatStyle(locale: locale).hour().minute()
    return Calendar.current.isDate(date, inSameDayAs: now)
      ? date.formatted(style)
      : date.formatted(style.month(.abbreviated).day())
  }

  /// When a target is reached `days` after `now`, as the wall's goal says it (`formatEta`):
  /// "today", "tomorrow", "Dec 14", then "Mar 2027".
  func eta(inDays days: Double, from now: Date) -> String {
    if days < 1 { return text.today }
    if days < 2 { return text.tomorrow }
    let date = now.addingTimeInterval(days * 86_400)
    return date.formatted(days < 45 ? dateStyle.month(.abbreviated).day() : dateStyle.month(.abbreviated).year())
  }

  /// The month before the one of `date`, in full, as months compare on the wall: "September".
  func previousMonthName(of date: Date) -> String {
    let start = calendar.dateInterval(of: .month, for: date)?.start ?? date
    let previous = calendar.date(byAdding: .month, value: -1, to: start) ?? start
    return previous.formatted(dateStyle.month(.wide))
  }

  private var calendar: Calendar {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = timeZone
    return calendar
  }

  private var dateStyle: Date.FormatStyle {
    Date.FormatStyle(locale: locale, calendar: calendar, timeZone: timeZone)
  }
}

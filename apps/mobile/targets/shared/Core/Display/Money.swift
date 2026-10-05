import Foundation

/// Amounts are integers in the currency's minor unit, like Stripe (`src/lib/money.ts`).
enum Money {
  /// See https://docs.stripe.com/currencies#zero-decimal. ISK, UGX, HUF and TWD are deliberately
  /// absent: for backward compatibility Stripe represents them with two decimals.
  private static let zeroDecimal: Set = [
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "vnd", "vuv", "xaf", "xof",
    "xpf",
  ]
  private static let threeDecimal: Set = ["bhd", "jod", "kwd", "omr", "tnd"]

  /// Decimal digits of the minor unit: 2 for USD cents, 0 for JPY, 3 for KWD.
  static func minorUnitDigits(_ currency: String) -> Int {
    let code = currency.lowercased()
    if zeroDecimal.contains(code) { return 0 }
    if threeDecimal.contains(code) { return 3 }
    return 2
  }

  static func majorUnits(_ amount: Int, currency: String) -> Decimal {
    Decimal(amount) / pow(10, minorUnitDigits(currency))
  }

  static func minorUnits(_ amount: Decimal, currency: String) -> Int {
    var minor = amount * pow(10, minorUnitDigits(currency))
    var rounded = Decimal()
    NSDecimalRound(&rounded, &minor, 0, .plain)
    return NSDecimalNumber(decimal: rounded).intValue
  }
}

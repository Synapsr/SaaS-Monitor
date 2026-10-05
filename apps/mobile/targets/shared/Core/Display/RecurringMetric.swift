import Foundation

/// How a screen presents recurring revenue (`src/lib/display/metric.ts`). States are always in
/// MRR: a screen set to ARR multiplies every recurring amount by twelve here, and nowhere else.
/// Payments and revenue are cash received: they never change.
extension ScreenSettings.Metric {
  /// Written after amounts in every language: "+$1,788 ARR".
  var label: String {
    switch self {
    case .mrr: "MRR"
    case .arr: "ARR"
    }
  }

  /// A monthly amount (MRR, or a change of it) in this metric.
  func fromMrr(_ amount: Int) -> Int {
    switch self {
    case .mrr: amount
    case .arr: amount * 12
    }
  }
}

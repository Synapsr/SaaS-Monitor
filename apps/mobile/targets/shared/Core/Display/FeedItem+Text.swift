import Foundation

/// How a screen describes feed items (`src/lib/display/feed.ts`).
extension FeedItem {
  /// Who the item is about, as the screen may show them: their name, else their email.
  var customerLabel: String? { customerName ?? customerEmail }

  /// Flag emoji of the country ("FR" → 🇫🇷).
  var flag: String? {
    guard let country, country.count == 2, country.allSatisfy({ $0.isASCII && $0.isLetter }) else {
      return nil
    }
    let scalars = country.uppercased().unicodeScalars.compactMap {
      Unicode.Scalar(0x1F1E6 + $0.value - 65)
    }
    return String(String.UnicodeScalarView(scalars))
  }
}

extension ScreenFormat {
  /// "$49" for a payment, "+$99" or "-$29" for a change of MRR (or ARR), nothing for a customer.
  func amount(of item: FeedItem, metric: ScreenSettings.Metric) -> String? {
    switch item.kind {
    case .customer: nil
    case .payment: payment(item.amount)
    default: amount(metric.fromMrr(item.amount), signed: true)
    }
  }

  /// What an item is: "Payment", "Connect" for a payment made for a Stripe Connect account, and
  /// why a subscription stopped counting ("Won't renew", "Payment failed").
  func kindLabel(of item: FeedItem) -> String {
    if item.connect != nil { return text.connectPayment }
    switch item.churn?.reason {
    case .scheduled: return text.churnReasons.scheduled
    case .unpaid: return text.churnReasons.unpaid
    case .paused: return text.churnReasons.paused
    case .canceled, nil: break
    }
    return switch item.kind {
    case .payment: text.kinds.payment
    case .customer: text.kinds.customer
    case .new: text.kinds.new
    case .expansion: text.kinds.expansion
    case .reactivation: text.kinds.reactivation
    case .contraction: text.kinds.contraction
    case .churn: text.kinds.churn
    }
  }
}

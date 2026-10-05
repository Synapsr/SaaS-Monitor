import SwiftUI

/// The icon of a feed item on a disc, in the accent for good news (`feed-kind-icon.tsx`): its
/// kind's, the Connect one for a payment made for a Stripe Connect account, or a churn's reason.
struct KindIcon: View {
  let item: FeedItem
  let style: ScreenStyle
  var size: CGFloat = 24

  var body: some View {
    Image(systemName: Self.symbol(for: item))
      .font(.system(size: size * 0.46, weight: .semibold))
      .foregroundStyle(item.kind.isGoodNews ? style.glowInk : style.ink2)
      .frame(width: size, height: size)
      .background(item.kind.isGoodNews ? style.glowWash : style.fill, in: .circle)
      .accessibilityHidden(true)
  }

  /// The SF Symbol standing for the wall's Lucide icon of an item.
  static func symbol(for item: FeedItem) -> String {
    if item.connect != nil { return "arrow.up.forward" }
    switch item.churn?.reason {
    case .scheduled: return "calendar.badge.minus"
    case .unpaid: return "creditcard"
    case .paused: return "pause.fill"
    case .canceled, nil: break
    }
    return switch item.kind {
    case .payment: "dollarsign"
    case .customer: "person.badge.plus"
    case .new: "sparkles"
    case .expansion: "arrow.up.right"
    case .reactivation: "arrow.counterclockwise"
    case .contraction: "arrow.down.right"
    case .churn: "person.badge.minus"
    }
  }
}

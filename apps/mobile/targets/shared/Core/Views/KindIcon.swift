import SwiftUI

/// The icon of a feed item on a disc (`feed-kind-icon.tsx`): lit by the accent for good news, in
/// the neutral ink otherwise.
struct KindIcon: View {
  let item: FeedItem
  let style: ScreenStyle
  var size: CGFloat = 24

  var body: some View {
    let good = item.kind.isGoodNews
    Image(systemName: item.symbol)
      .font(.system(size: size * 0.44, weight: .semibold))
      .foregroundStyle(good ? style.glowInk : style.ink2)
      .frame(width: size, height: size)
      .background(good ? style.glowWash : style.fill, in: .circle)
      .overlay {
        Circle().strokeBorder(good ? style.glow.opacity(0.35) : style.ink.opacity(0.08), lineWidth: 1)
      }
      .accessibilityHidden(true)
  }
}

extension FeedItem {
  /// The SF Symbol standing for the wall's Lucide icon of an item: its kind's, the Connect one for
  /// a payment made for a Stripe Connect account, or a churn's reason.
  var symbol: String {
    if connect != nil { return "arrow.up.forward" }
    switch churn?.reason {
    case .scheduled: return "calendar.badge.minus"
    case .unpaid: return "creditcard"
    case .paused: return "pause.fill"
    case .canceled, nil: break
    }
    return switch kind {
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

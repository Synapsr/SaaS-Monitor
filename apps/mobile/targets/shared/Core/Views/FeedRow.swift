import SwiftUI

/// A feed item as the wall lists it (`live-feed.tsx`): its amount leads (or the customer, for a new
/// one), then what it is, who, and when.
struct FeedRow: View {
  let item: FeedItem
  let figures: ScreenFigures
  let style: ScreenStyle
  /// The time "5 min ago" is counted from.
  let now: Date
  var iconSize: CGFloat = 24

  var body: some View {
    HStack(spacing: 8) {
      KindIcon(item: item, style: style, size: iconSize)
      VStack(alignment: .leading, spacing: 1) {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          // The metric goes first where the time needs the room.
          ViewThatFits(in: .horizontal) {
            headlineText(showsMetric: true)
            headlineText(showsMetric: false)
          }
          Spacer(minLength: 4)
          Text(format.feedTime(item.occurredAt, now: now))
            .font(.caption2)
            .monospacedDigit()
            .foregroundStyle(style.ink3)
            .fixedSize()
        }
        Text(detailLine)
          .font(.footnote)
          .foregroundStyle(style.ink2)
      }
      .lineLimit(1)
    }
    .accessibilityElement(children: .combine)
  }

  private var format: ScreenFormat { figures.format }
  private var amount: String? { format.amount(of: item, metric: figures.metric) }
  private var kind: String { format.kindLabel(of: item) }

  /// A new customer has no amount: their name leads, or what they are when it is hidden.
  private var headline: String { amount ?? item.customerLabel ?? kind }

  private var details: [String] {
    [headline == kind ? nil : kind, amount == nil ? nil : item.customerLabel, item.planName]
      .compactMap(\.self)
  }

  /// "🇫🇷 New subscription · Lumen Labs · Team"; without other details, the country is worth its
  /// name.
  private var detailLine: String {
    let rest = details.isEmpty
      ? item.country.flatMap { format.locale.localizedString(forRegionCode: $0) }
      : details.joined(separator: " · ")
    return [item.flag, rest].compactMap(\.self).joined(separator: " ")
  }

  private func headlineText(showsMetric: Bool) -> some View {
    HStack(alignment: .firstTextBaseline, spacing: 3) {
      Text(headline)
        .fontWeight(.semibold)
        .monospacedDigit()
        .foregroundStyle(item.kind.isGoodNews ? style.ink : style.ink2)
      // A subscription change reads "+$99 MRR"; a payment is money received.
      if showsMetric, amount != nil, item.kind != .payment {
        TelemetryLabel(figures.metric.label, locale: format.locale, size: 9).foregroundStyle(style.ink3)
      }
    }
  }
}

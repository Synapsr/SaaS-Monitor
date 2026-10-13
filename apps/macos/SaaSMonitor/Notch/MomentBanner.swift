import SwiftUI

/// A moment, dropping from the notch: what happened and how much, in its screen's language and
/// accent, as the wall's card says it.
struct MomentBanner: View {
  let moment: StagedMoment
  let layout: NotchLayout

  var body: some View {
    let card = moment.card
    let style = card.style
    VStack(spacing: 0) {
      // Beside the notch: which screen it happened on.
      HStack(spacing: 6) {
        LiveDot(color: style.glow, size: 5)
        Text(card.screenName)
          .font(.system(size: 11, weight: .medium))
          .foregroundStyle(style.ink3)
          .lineLimit(1)
        Spacer(minLength: 0)
      }
      .padding(.leading, 18)
      .frame(width: wingWidth, height: layout.notch.height, alignment: .leading)
      .frame(maxWidth: .infinity, alignment: .leading)

      HStack(spacing: 14) {
        Image(systemName: card.symbol)
          .font(.system(size: 17, weight: .semibold))
          .foregroundStyle(card.isCelebration ? style.glowInk : style.ink2)
          .frame(width: 40, height: 40)
          .background(card.isCelebration ? style.glowWash : style.fill, in: .circle)
          .overlay {
            Circle().strokeBorder(card.isCelebration ? style.glow.opacity(0.4) : style.ink.opacity(0.08), lineWidth: 1)
          }
          .symbolEffect(.bounce, value: moment.id)

        VStack(alignment: .leading, spacing: 3) {
          Text(card.title)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(card.isCelebration ? style.glowInk : style.ink2)
          if !detailLine.isEmpty {
            Text(detailLine)
              .font(.system(size: 12))
              .foregroundStyle(style.ink3)
          }
        }
        .lineLimit(1)

        Spacer(minLength: 8)

        VStack(alignment: .trailing, spacing: 1) {
          if card.headlineIsName {
            Text(card.headline)
              .font(.system(size: 19, weight: .semibold))
              .foregroundStyle(style.ink)
              .lineLimit(1)
          } else {
            HeroReadout(
              text: card.headline, value: 0, style: style, size: 30,
              ink: card.isCelebration ? style.ink : style.ink2)
          }
          if let label = card.metricLabel {
            TelemetryLabel(label, locale: card.locale, size: 9)
              .foregroundStyle(style.ink3)
          }
        }
        .layoutPriority(1)
      }
      .padding(.horizontal, 20)
      .frame(maxHeight: .infinity)
    }
    .overlay {
      if moment.celebration == .payment { Shimmer(color: style.glowInk) }
    }
    .accessibilityElement(children: .combine)
  }

  /// Room left of the notch.
  private var wingWidth: CGFloat {
    (layout.size(.moment).width - 2 * NotchLayout.flare - layout.notch.width) / 2
  }

  /// "Lumen Labs · Team · 🇫🇷 France", and the account on a screen showing several.
  private var detailLine: String {
    ([moment.card.account] + moment.card.details.map(Optional.some) + [moment.card.footnote])
      .compactMap(\.self)
      .joined(separator: " · ")
  }
}

/// A gleam crossing the banner once, as money comes in.
private struct Shimmer: View {
  let color: Color
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.isStillRender) private var isStillRender
  @State private var crossed = false

  var body: some View {
    GeometryReader { proxy in
      // Taller than the banner, so that its slant never shows an edge.
      LinearGradient(colors: [.clear, color.opacity(0.16), .clear], startPoint: .leading, endPoint: .trailing)
        .frame(width: proxy.size.width * 0.45, height: proxy.size.height * 4)
        .rotationEffect(.degrees(14))
        .offset(x: crossed ? proxy.size.width * 1.2 : -proxy.size.width * 0.6, y: -proxy.size.height * 1.5)
    }
    .allowsHitTesting(false)
    .blendMode(.plusLighter)
    .opacity(reduceMotion || isStillRender ? 0 : 1)
    .onAppear {
      withAnimation(.easeInOut(duration: 1.1).delay(0.25)) { crossed = true }
    }
  }
}

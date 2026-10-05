import SwiftUI

/// The moments of a screen, one card after the other, over the whole watch. A tap moves on.
struct MomentStage: View {
  let presenter: MomentPresenter
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    ZStack {
      if let card = presenter.current {
        MomentCardView(card: card)
          .id(card.id)
          .transition(reduceMotion ? .opacity : .scale(scale: 0.9).combined(with: .opacity))
      }
    }
    .animation(reduceMotion ? nil : .spring(duration: 0.5, bounce: 0.2), value: presenter.current?.id)
    .contentShape(.rect)
    .onTapGesture { presenter.skip() }
    .toolbar(.hidden, for: .navigationBar)
  }
}

/// A moment as the wall's card shows it (`moment-card.tsx`): what happened, the amount big, then
/// who and what. Losses go without glow nor color.
struct MomentCardView: View {
  let card: MomentCard

  private var style: ScreenStyle { card.style }

  var body: some View {
    VStack(spacing: 6) {
      if let account = card.account {
        Text(account)
          .font(.caption2.weight(.semibold))
          .foregroundStyle(style.ink)
          .lineLimit(1)
          .padding(.horizontal, 8)
          .padding(.vertical, 3)
          .background(style.fill, in: .capsule)
      }
      Label(card.title, systemImage: card.symbol)
        .font(.footnote.weight(.semibold))
        .foregroundStyle(card.isCelebration ? style.glowInk : style.ink2)
        .lineLimit(2)
        .multilineTextAlignment(.center)
      headline
      if !card.details.isEmpty {
        Text(card.details.joined(separator: " · "))
          .font(.footnote)
          .foregroundStyle(style.ink2)
          .lineLimit(3)
          .multilineTextAlignment(.center)
      }
      if let footnote = card.footnote {
        Text(footnote)
          .font(.caption2.weight(.medium))
          .monospacedDigit()
          .foregroundStyle(card.isCelebration ? style.glowInk : style.ink2)
          .lineLimit(2)
          .multilineTextAlignment(.center)
          .padding(.horizontal, 10)
          .padding(.vertical, 4)
          .background(card.isCelebration ? style.glowWash : style.fill, in: .capsule)
      }
    }
    .padding(.horizontal, 10)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background { background }
    .accessibilityElement(children: .combine)
  }

  private var headline: some View {
    HStack(alignment: .firstTextBaseline, spacing: 4) {
      Text(card.headline)
        .font(.system(size: card.headlineIsName ? 26 : 40, weight: .semibold))
        .monospacedDigit()
        .foregroundStyle(card.isCelebration ? style.ink : style.ink2)
        .lineLimit(card.headlineIsName ? 2 : 1)
        .minimumScaleFactor(0.4)
        .multilineTextAlignment(.center)
      if let metric = card.metricLabel {
        Text(metric).font(.footnote.weight(.medium)).foregroundStyle(style.ink3)
      }
    }
  }

  /// Near-black, lit by the accent from above for good news.
  private var background: some View {
    ZStack {
      style.background
      if card.isCelebration {
        RadialGradient(colors: [style.glow.opacity(0.35), .clear], center: .top, startRadius: 0, endRadius: 180)
      }
    }
    .ignoresSafeArea()
  }
}

#Preview("Payment") {
  let state = DisplayState.sample()
  MomentCardView(card: MomentCard(.payment(state.feed[0]), state: state))
}

#Preview("Cancellation, French") {
  let state = DisplayState.sample(accent: "violet", language: .fr)
  MomentCardView(card: MomentCard(.movement(state.feed[3]), state: state))
}

#Preview("Test") {
  let state = DisplayState.sample(accent: "#ff6b35", language: .de, currency: "eur")
  MomentCardView(card: MomentCard(.test(id: "preview"), state: state))
}

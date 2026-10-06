import SwiftUI

/// The moments of a screen, one card after the other, over the whole watch. A tap moves on.
struct MomentStage: View {
  let presenter: MomentPresenter
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    ZStack {
      if let card = presenter.current {
        // The burst only fades: scaled with the card, its edges would show.
        MomentBurst(style: card.style, isCelebration: card.isCelebration)
          .id("burst:\(card.id)")
          .transition(.opacity)
        MomentCardView(card: card)
          .id(card.id)
          .transition(reduceMotion ? .opacity : .scale(scale: 0.86).combined(with: .opacity))
      }
    }
    .animation(reduceMotion ? nil : .spring(duration: 0.55, bounce: 0.25), value: presenter.current?.id)
    .contentShape(.rect)
    .onTapGesture { presenter.skip() }
    .toolbar(.hidden, for: .navigationBar)
  }
}

/// A moment as the wall's card tells it (`moment-card.tsx`), as an instrument would: where it
/// happened, its icon glowing, what happened, the amount as a hero, and who. Losses go without glow
/// nor color. Over a `MomentBurst`.
struct MomentCardView: View {
  let card: MomentCard

  private var style: ScreenStyle { card.style }

  var body: some View {
    VStack(spacing: 0) {
      origin
      Spacer(minLength: 4)
      emblem
      Text(card.title)
        .font(.footnote.weight(.semibold))
        .foregroundStyle(card.isCelebration ? style.glowInk : style.ink2)
        .lineLimit(2)
        .multilineTextAlignment(.center)
        .padding(.top, 6)
      headline
        .layoutPriority(1)
      if !card.details.isEmpty {
        Text(card.details.joined(separator: " · "))
          .font(.caption2)
          .foregroundStyle(style.ink2)
          .lineLimit(2)
          .multilineTextAlignment(.center)
      }
      if let footnote = card.footnote {
        Text(footnote)
          .font(.caption2.weight(.medium))
          .monospacedDigit()
          .foregroundStyle(card.isCelebration ? style.glowInk : style.ink2)
          .lineLimit(2)
          .multilineTextAlignment(.center)
          .padding(.horizontal, 9)
          .padding(.vertical, 3)
          .background(card.isCelebration ? style.glowWash : style.fill, in: .capsule)
          .padding(.top, 5)
      }
      Spacer(minLength: 4)
    }
    .padding(.horizontal, 8)
    .padding(.bottom, 6)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    // The bottom edge has room for the last line.
    .ignoresSafeArea(edges: .bottom)
    .accessibilityElement(children: .combine)
  }

  /// "PELLI · LOUEZ": the screen, and the account on a screen showing several.
  private var origin: some View {
    HStack(spacing: 5) {
      TelemetryLabel(card.screenName, locale: card.locale)
        .layoutPriority(-1)
      if let account = card.account {
        TelemetryLabel("· \(account)", locale: card.locale)
          .foregroundStyle(style.ink2)
          .fixedSize()
      }
    }
    .foregroundStyle(style.ink3)
  }

  @ViewBuilder
  private var emblem: some View {
    if card.isMilestone {
      GoalRing(progress: 1, style: style, lineWidth: 6, fillsIn: true) {
        Image(systemName: card.symbol)
          .font(.system(size: 18, weight: .semibold))
          .foregroundStyle(style.glowInk)
      }
      .frame(width: 54, height: 54)
      .shadow(color: style.glow.opacity(0.6), radius: 10)
    } else {
      Image(systemName: card.symbol)
        .font(.system(size: 18, weight: .semibold))
        .foregroundStyle(card.isCelebration ? style.glowInk : style.ink2)
        .frame(width: 42, height: 42)
        .background(card.isCelebration ? style.glow.opacity(0.22) : style.fill, in: .circle)
        .overlay {
          Circle().strokeBorder(card.isCelebration ? style.glow.opacity(0.6) : style.ink.opacity(0.12), lineWidth: 1)
        }
        .shadow(color: card.isCelebration ? style.glow.opacity(0.7) : .clear, radius: 12)
    }
  }

  @ViewBuilder
  private var headline: some View {
    HStack(alignment: .firstTextBaseline, spacing: 4) {
      if card.headlineIsName {
        Text(card.headline)
          .font(.system(size: 24, weight: .semibold))
          .foregroundStyle(style.ink)
          .lineLimit(2)
          .minimumScaleFactor(0.6)
          .multilineTextAlignment(.center)
      } else {
        HeroReadout(
          text: card.headline,
          value: 0,
          style: style,
          size: 36,
          ink: card.isCelebration ? style.ink : style.ink2
        )
      }
      if let metric = card.metricLabel {
        TelemetryLabel(metric, locale: card.locale)
          .foregroundStyle(style.ink3)
      }
    }
    .padding(.top, 1)
  }
}

/// Near-black, and for good news the accent bursting out from behind the icon, once.
struct MomentBurst: View {
  let style: ScreenStyle
  let isCelebration: Bool
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var burst = false

  /// Where the icon sits.
  private let center = UnitPoint(x: 0.5, y: 0.36)

  var body: some View {
    GeometryReader { proxy in
      let origin = CGPoint(x: proxy.size.width * center.x, y: proxy.size.height * center.y)
      ZStack {
        style.background
        if isCelebration {
          // A disc fading to nothing at its edge, so it can grow from the icon.
          Circle()
            .fill(RadialGradient(
              colors: [style.glow.opacity(0.55), style.glow.opacity(0.16), style.glow.opacity(0)],
              center: .center,
              startRadius: 0,
              endRadius: 170
            ))
            .frame(width: 340, height: 340)
            .scaleEffect(burst ? 1 : 0.3)
            .opacity(burst ? 1 : 0)
            .position(origin)
          if !reduceMotion {
            Circle()
              .strokeBorder(style.glow.opacity(0.7), lineWidth: 1.5)
              .frame(width: 60, height: 60)
              .scaleEffect(burst ? 5 : 1)
              .opacity(burst ? 0 : 0.8)
              .position(origin)
          }
        }
      }
    }
    .ignoresSafeArea()
    .onAppear {
      if reduceMotion {
        burst = true
      } else {
        withAnimation(.easeOut(duration: 1.1)) { burst = true }
      }
    }
  }
}

#Preview("Payment") {
  let state = DisplayState.sample()
  let card = MomentCard(.payment(state.feed[0]), state: state)
  MomentCardView(card: card).background { MomentBurst(style: card.style, isCelebration: true) }
}

#Preview("Cancellation, French") {
  let state = DisplayState.sample(accent: "violet", language: .fr)
  MomentCardView(card: MomentCard(.movement(state.feed[3]), state: state))
}

#Preview("Milestone") {
  let state = DisplayState.sample(accent: "sky")
  MomentCardView(card: MomentCard(.milestone(amount: 15_000_00, metric: .mrr, isGoal: true), state: state))
}

#Preview("Test") {
  let state = DisplayState.sample(accent: "#ff6b35", language: .de, currency: "eur")
  MomentCardView(card: MomentCard(.test(id: "preview"), state: state))
}

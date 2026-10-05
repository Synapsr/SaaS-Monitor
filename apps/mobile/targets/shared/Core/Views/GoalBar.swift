import SwiftUI
import WidgetKit

/// The goal, or next milestone, and how far it is (`goal-progress.tsx`): "Goal $15K MRR · 83%"
/// over a bar from the accent's deep shade to its glow.
struct GoalBar: View {
  let figures: ScreenFigures
  let style: ScreenStyle
  var showsRemaining = false

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      // Where "Objectif 180 k $US ARR" doesn't fit, the target goes without its title.
      ViewThatFits(in: .horizontal) {
        header(titled: true)
        header(titled: false)
      }
      .lineLimit(1)
      track
      if showsRemaining {
        Text(figures.goalRemainingText)
          .monospacedDigit()
          .foregroundStyle(style.ink2)
          .lineLimit(1)
      }
    }
    .accessibilityElement(children: .combine)
  }

  private func header(titled: Bool) -> some View {
    HStack(alignment: .firstTextBaseline, spacing: 4) {
      if titled { Text(figures.goalTitle).foregroundStyle(style.ink2) }
      Text(figures.goalTargetText).fontWeight(.semibold).foregroundStyle(style.ink)
      Spacer(minLength: 4)
      Text(figures.goalPercentText).monospacedDigit().foregroundStyle(style.ink2)
    }
  }

  private var track: some View {
    Capsule()
      .fill(style.fill)
      .frame(height: 6)
      .overlay(alignment: .leading) {
        GeometryReader { proxy in
          Capsule()
            .fill(LinearGradient(colors: [style.glowDeep, style.glow], startPoint: .leading, endPoint: .trailing))
            .frame(width: max(6, proxy.size.width * figures.goal.progress))
            .widgetAccentable()
        }
      }
  }
}

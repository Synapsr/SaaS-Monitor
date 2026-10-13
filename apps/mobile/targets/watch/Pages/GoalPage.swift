import SwiftUI

/// How far the goal, or the next milestone, is: a ring around the share reached, then what is
/// left and when it comes at this pace.
struct GoalPage: View {
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    VStack(spacing: 6) {
      TelemetryLabel(figures.goalTitle, locale: figures.format.locale)
        .foregroundStyle(style.ink3)
      GoalRing(progress: figures.goal.progress, style: style, lineWidth: 9, fillsIn: true) {
        VStack(spacing: 2) {
          Text(figures.goalPercentText)
            .font(.system(size: 28, weight: .semibold))
            .monospacedDigit()
            .foregroundStyle(style.ink)
            .contentTransition(.numericText(value: figures.goal.progress))
          TelemetryLabel(figures.goalTargetText, locale: figures.format.locale, size: 9, uppercased: false)
            .foregroundStyle(style.glowInk)
        }
        .lineLimit(1)
        .minimumScaleFactor(0.6)
      }
      .frame(width: 104, height: 104)
      VStack(spacing: 1) {
        Text(figures.goalRemainingText)
          .font(.footnote.weight(.semibold))
          .monospacedDigit()
          .foregroundStyle(style.ink)
        if let eta = figures.goalEtaText {
          Text(eta)
            .font(.caption2)
            .foregroundStyle(style.ink3)
        }
      }
      .lineLimit(1)
      .minimumScaleFactor(0.7)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .pageInsets()
    .accessibilityElement(children: .combine)
  }
}

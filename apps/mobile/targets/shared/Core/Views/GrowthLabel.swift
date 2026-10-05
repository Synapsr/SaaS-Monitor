import SwiftUI
import WidgetKit

/// How the metric moved in 30 days, as the wall's badge: "+$1,020 · +8.9%", in the accent when it
/// grows. Falls back to the percentage alone where the whole doesn't fit.
struct GrowthLabel: View {
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    HStack(spacing: 3) {
      Image(systemName: figures.isGrowing ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis")
        .imageScale(.small)
      ViewThatFits(in: .horizontal) {
        Text(figures.growthText)
        if let percent = figures.growthPercentText { Text(percent) }
      }
    }
    .fontWeight(.semibold)
    .monospacedDigit()
    .lineLimit(1)
    .foregroundStyle(figures.isGrowing ? style.glowInk : style.ink2)
    .widgetAccentable()
  }
}

import SwiftUI
import WidgetKit

/// The recurring revenue in large, its growth in 30 days, and today's revenue: what StandBy and
/// CarPlay show, read at a glance from a desk or a dashboard.
struct SmallScreenView: View {
  let entry: ScreenEntry
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      ScreenHeader(figures: figures, style: style)
      Spacer(minLength: 4)
      HeroNumber(figures: figures, style: style, size: 34)
      GrowthLabel(figures: figures, style: style)
        .font(.footnote)
      Spacer(minLength: 4)
      HStack(alignment: .lastTextBaseline) {
        VStack(alignment: .leading, spacing: 0) {
          Text(figures.text.revenueToday)
            .font(.caption2)
            .foregroundStyle(style.ink3)
          Text(figures.revenueTodayText)
            .font(.subheadline.weight(.semibold))
            .monospacedDigit()
            .foregroundStyle(style.ink)
        }
        .lineLimit(1)
        if entry.isStale, let fetchedAt = entry.fetchedAt {
          Spacer(minLength: 4)
          StaleStamp(fetchedAt: fetchedAt, now: entry.date, format: figures.format, offline: entry.isOffline, style: style)
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// "Acme · MRR": which screen, and which metric.
struct ScreenHeader: View {
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    HStack(spacing: 4) {
      Text(figures.name)
        .fontWeight(.semibold)
        .foregroundStyle(style.ink2)
      Text("·").foregroundStyle(style.ink3)
      Text(figures.metric.label)
        .foregroundStyle(style.ink3)
        .fixedSize()
    }
    .font(.caption)
    .lineLimit(1)
  }
}

/// The screen's main number: as large as the widget allows.
struct HeroNumber: View {
  let figures: ScreenFigures
  let style: ScreenStyle
  let size: CGFloat

  var body: some View {
    Text(figures.valueText)
      .font(.system(size: size, weight: .semibold))
      .tracking(-size * 0.03)
      .monospacedDigit()
      .lineLimit(1)
      .minimumScaleFactor(0.5)
      .foregroundStyle(style.ink)
      .contentTransition(.numericText(value: Double(figures.value)))
  }
}

#Preview("Small", as: .systemSmall) {
  ScreenWidget()
} timeline: {
  ScreenEntry.sample()
  ScreenEntry.preview(.sample(name: "Lumen", metric: .arr, accent: "violet", theme: .light, language: .fr, currency: "eur"))
  ScreenEntry.preview(.sample(accent: "#ff6b35", language: .de), stale: true)
}

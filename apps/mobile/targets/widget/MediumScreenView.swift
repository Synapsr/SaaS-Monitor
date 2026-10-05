import SwiftUI
import WidgetKit

/// The small widget's numbers, with today's revenue beside them, then the goal's progress and the
/// latest activity.
struct MediumScreenView: View {
  let entry: ScreenEntry
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .top, spacing: 12) {
        VStack(alignment: .leading, spacing: 1) {
          ScreenHeader(figures: figures, style: style)
          HeroNumber(figures: figures, style: style, size: 32)
          GrowthLabel(figures: figures, style: style)
            .font(.footnote)
        }
        Spacer(minLength: 0)
        VStack(alignment: .trailing, spacing: 1) {
          Text(figures.text.revenueToday)
            .font(.caption)
            .foregroundStyle(style.ink3)
          Text(figures.revenueTodayText)
            .font(.headline)
            .monospacedDigit()
            .foregroundStyle(style.ink)
          if entry.isStale, let fetchedAt = entry.fetchedAt {
            StaleStamp(fetchedAt: fetchedAt, now: entry.date, format: figures.format, offline: entry.isOffline, style: style)
              .padding(.top, 2)
          }
        }
        .lineLimit(1)
      }
      Spacer(minLength: 6)
      GoalBar(figures: figures, style: style)
        .font(.caption)
      Spacer(minLength: 6)
      if let latest = figures.feed.first {
        FeedRow(item: latest, figures: figures, style: style, now: entry.date, singleLine: true, iconSize: 20)
          .font(.caption)
      } else {
        Text(figures.text.noActivity)
          .font(.caption)
          .foregroundStyle(style.ink3)
      }
    }
  }
}

#Preview("Medium", as: .systemMedium) {
  ScreenWidget()
} timeline: {
  ScreenEntry.sample()
  ScreenEntry.preview(.sample(name: "Lumen", metric: .arr, accent: "violet", theme: .light, language: .fr, currency: "eur"))
  ScreenEntry.preview(.sample(accent: "#ff6b35", language: .de), stale: true)
}

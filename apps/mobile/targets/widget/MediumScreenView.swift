import SwiftUI
import WidgetKit

/// The small widget's instrument, with the goal's ring and today's revenue beside it.
struct MediumScreenView: View {
  let entry: ScreenEntry
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      ScreenHeader(entry: entry, figures: figures, style: style, showsLiveLabel: true)
      HStack(alignment: .top, spacing: 10) {
        VStack(alignment: .leading, spacing: 3) {
          HeroReadout(figures, style: style, size: 40)
            .privacySensitive()
          HStack(spacing: 6) {
            DeltaChip(figures, style: style, size: 12)
            if entry.isStale, let fetchedAt = entry.fetchedAt {
              StaleStamp(fetchedAt: fetchedAt, now: entry.date, format: figures.format, offline: entry.isOffline, style: style)
            }
          }
        }
        .layoutPriority(1)
        Spacer(minLength: 0)
        today
        goal
      }
      .padding(.top, 8)
      Spacer(minLength: figures.series.count > 1 ? 24 : 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(alignment: .bottom) {
      BleedingSparkline(figures: figures, style: style, height: 52)
    }
  }

  private var today: some View {
    VStack(alignment: .trailing, spacing: 2) {
      TelemetryLabel(figures.text.today, locale: figures.format.locale, size: 9)
        .foregroundStyle(style.ink3)
      HeroReadout(text: figures.format.attributedAmount(figures.revenueToday), value: figures.revenueToday, style: style, size: 18)
        .privacySensitive()
    }
    .padding(.top, 4)
    .accessibilityElement(children: .combine)
  }

  private var goal: some View {
    GoalRing(progress: figures.goal.progress, style: style, lineWidth: 6) {
      VStack(spacing: 0) {
        Text(figures.goalPercentText)
          .font(.system(size: 15, weight: .semibold))
          .monospacedDigit()
          .foregroundStyle(style.ink)
        TelemetryLabel(figures.format.amount(figures.goal.target, compact: true), locale: figures.format.locale, size: 7.5, uppercased: false)
          .foregroundStyle(style.ink3)
      }
      .lineLimit(1)
      .minimumScaleFactor(0.6)
    }
    .frame(width: 66, height: 66)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("\(figures.goalTitle) \(figures.goalTargetText), \(figures.goalPercentText)")
  }
}

#Preview("Medium", as: .systemMedium) {
  ScreenWidget()
} timeline: {
  ScreenEntry.sample()
  ScreenEntry.preview(.sample(name: "Lumen", metric: .arr, accent: "violet", theme: .light, language: .fr, currency: "eur"))
  ScreenEntry.preview(.sample(accent: "#ff6b35", language: .de), stale: true)
}

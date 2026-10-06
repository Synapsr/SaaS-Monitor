import SwiftUI
import WidgetKit

/// The recurring revenue as an instrument shows it, readable at arm's length: what StandBy and
/// CarPlay show, from a desk or a dashboard. Which screen and whether it's live, the number, how it
/// moved in 30 days, and its curve along the bottom edge.
struct SmallScreenView: View {
  let entry: ScreenEntry
  let figures: ScreenFigures
  let style: ScreenStyle

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      ScreenHeader(entry: entry, figures: figures, style: style)
      Spacer(minLength: 2)
      HeroReadout(figures, style: style, size: 36)
        .privacySensitive()
      HStack(spacing: 4) {
        DeltaChip(figures, style: style, size: 12)
        if entry.isStale, let fetchedAt = entry.fetchedAt {
          Spacer(minLength: 0)
          StaleStamp(fetchedAt: fetchedAt, now: entry.date, format: figures.format, offline: entry.isOffline, style: style)
        }
      }
      .padding(.top, 3)
      // The curve's room: it rises behind nothing else.
      Spacer(minLength: figures.series.count > 1 ? 30 : 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .background(alignment: .bottom) {
      BleedingSparkline(figures: figures, style: style, height: 50)
    }
  }
}

/// "ACME · MRR" and whether the numbers are live: which screen, and which metric.
struct ScreenHeader: View {
  let entry: ScreenEntry
  let figures: ScreenFigures
  let style: ScreenStyle
  var showsLiveLabel = false

  var body: some View {
    HStack(spacing: 5) {
      HStack(spacing: 4) {
        TelemetryLabel(figures.name, locale: figures.format.locale)
          .foregroundStyle(style.ink2)
          .layoutPriority(-1)
        TelemetryLabel("· \(figures.metric.label)", locale: figures.format.locale)
          .foregroundStyle(style.ink3)
          .fixedSize()
      }
      Spacer(minLength: 0)
      if entry.isStale {
        Circle().fill(style.ink3).frame(width: 6, height: 6)
      } else {
        HStack(spacing: 5) {
          LiveDot(color: style.glow, size: 6)
          if showsLiveLabel {
            TelemetryLabel(figures.text.live, locale: figures.format.locale)
              .foregroundStyle(style.ink2)
          }
        }
        .widgetAccentable()
      }
    }
  }
}

/// The screen's curve from one edge of the widget to the other, under its margins.
struct BleedingSparkline: View {
  let figures: ScreenFigures
  let style: ScreenStyle
  let height: CGFloat
  @Environment(\.widgetContentMargins) private var margins
  @Environment(\.widgetRenderingMode) private var renderingMode

  var body: some View {
    if figures.series.count > 1 {
      Sparkline(
        values: figures.series,
        color: renderingMode == .fullColor ? style.glow : .primary,
        dotColor: renderingMode == .fullColor ? style.glowInk : .primary,
        lineWidth: 2.2,
        fillOpacity: renderingMode == .fullColor ? 0.42 : 0.2,
        // Now's dot, glowing, stays clear of the corner.
        endInset: margins.trailing * 0.8
      )
      .frame(height: height)
      .padding(.leading, -margins.leading)
      .padding(.trailing, -margins.trailing)
      .padding(.bottom, -margins.bottom)
      .widgetAccentable()
      .privacySensitive()
    }
  }
}

#Preview("Small", as: .systemSmall) {
  ScreenWidget()
} timeline: {
  ScreenEntry.sample()
  ScreenEntry.preview(.sample(name: "Lumen", metric: .arr, accent: "violet", theme: .light, language: .fr, currency: "eur"))
  ScreenEntry.preview(.sample(accent: "#ff6b35", language: .de), stale: true)
}

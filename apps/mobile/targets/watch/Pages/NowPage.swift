import SwiftUI

/// The screen's metric as an instrument reads it: what it is and whether it is live, the number,
/// how it moved in 30 days, and its curve along the bottom edge.
struct NowPage: View {
  let figures: ScreenFigures
  let snapshot: ScreenSnapshot
  let style: ScreenStyle

  var body: some View {
    TimelineView(.everyMinute) { context in
      VStack(alignment: .leading, spacing: 5) {
        HStack(spacing: 6) {
          TelemetryLabel(figures.metric.label, locale: figures.format.locale)
            .foregroundStyle(style.ink3)
            .fixedSize()
          Spacer(minLength: 0)
          LiveIndicator(
            freshness: .init(snapshot, at: context.date),
            format: figures.format,
            style: style,
            now: context.date
          )
        }
        HeroReadout(figures, style: style, size: 44)
          .padding(.top, 2)
        DeltaChip(figures, style: style, size: 13)
        Spacer(minLength: 0)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .pageInsets()
    }
    .background(alignment: .bottom) {
      if figures.series.count > 1 {
        Sparkline(
          values: figures.series,
          color: style.glow,
          dotColor: style.glowInk,
          lineWidth: 2,
          fillOpacity: 0.4,
          drawsIn: true,
          // Now's dot stays clear of the round edge.
          endInset: 16
        )
        .frame(height: 80)
        .ignoresSafeArea()
      }
    }
    .accessibilityElement(children: .combine)
  }
}

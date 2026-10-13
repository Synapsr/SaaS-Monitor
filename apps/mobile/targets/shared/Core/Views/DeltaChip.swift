import SwiftUI
import WidgetKit

/// How a number moved, as a chip: "▲ +1.2% 30d", tinted with the accent when it grows, in the
/// neutral ink when it falls (a loss is honest, never alarming) or stays. The arrow says the way,
/// so color carries no meaning alone.
struct DeltaChip: View {
  let trend: Trend
  let value: String
  /// What it compares with, dimmer: "30 d".
  var period: String?
  let style: ScreenStyle
  var size: CGFloat = 12
  @ScaledMetric(relativeTo: .footnote) private var scale: CGFloat = 1

  var body: some View {
    let size = size * scale
    let isUp = trend == .up
    HStack(spacing: size * 0.3) {
      Image(systemName: symbol)
        .font(.system(size: size * 0.62, weight: .bold))
      Text(value)
        .font(.system(size: size, weight: .semibold))
        .monospacedDigit()
      if let period {
        Text(period)
          .font(.system(size: size * 0.86, weight: .medium, design: .monospaced))
          .opacity(0.72)
      }
    }
    .lineLimit(1)
    .foregroundStyle(isUp ? style.glowInk : style.ink2)
    .padding(.horizontal, size * 0.6)
    .padding(.vertical, size * 0.26)
    .background(isUp ? style.glow.opacity(0.16) : style.fill, in: .capsule)
    .widgetAccentable()
  }

  private var symbol: String {
    switch trend {
    case .up: "arrowtriangle.up.fill"
    case .flat: "minus"
    case .down: "arrowtriangle.down.fill"
    }
  }
}

extension DeltaChip {
  /// How the screen's metric moved in 30 days.
  init(_ figures: ScreenFigures, style: ScreenStyle, size: CGFloat = 12, showsPeriod: Bool = true) {
    self.init(
      trend: figures.trend,
      value: figures.deltaText,
      period: showsPeriod ? figures.text.thirtyDays : nil,
      style: style,
      size: size
    )
  }
}

import SwiftUI

/// The selected screen beside the notch, as the Dynamic Island does: its curve on the left, its
/// number on the right, the notch itself left free.
struct CompactFigures: View {
  let figures: ScreenFigures
  let layout: NotchLayout

  var body: some View {
    let style = figures.style.onDark
    HStack(spacing: 0) {
      Sparkline(
        values: figures.series, color: style.glow, dotColor: style.glowInk, lineWidth: 1.5,
        fillOpacity: 0.22, endInset: 3
      )
      .frame(width: 42, height: 13)
      .frame(width: NotchLayout.wing, alignment: .center)

      Spacer(minLength: 0)
        .frame(width: layout.notch.width)

      Text(figures.compactValueText)
        .font(.system(size: 13, weight: .semibold))
        .monospacedDigit()
        .foregroundStyle(style.ink)
        .contentTransition(.numericText(value: Double(figures.value)))
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .padding(.horizontal, 10)
        .frame(width: NotchLayout.wing, alignment: .center)
    }
    .frame(height: layout.notch.height)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("\(figures.name): \(figures.compactValueText) \(figures.metric.label)")
  }
}

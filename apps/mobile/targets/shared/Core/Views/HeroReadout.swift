import SwiftUI

/// An amount as the largest thing around: tabular digits, rolling from one value to the next, the
/// currency symbol smaller and dimmer, before or after them as the language writes it. Never
/// tighter than the system's tracking, which would swallow the narrow space French groups digits
/// with ("5 758 €").
struct HeroReadout: View {
  let text: AttributedString
  /// What the digits roll with.
  let value: Int
  let style: ScreenStyle
  let size: CGFloat
  var weight: Font.Weight = .semibold
  /// Of the symbol, to the digits.
  var symbolScale: CGFloat = 0.6
  /// The digits' color, the theme's ink unless said otherwise.
  var ink: Color?

  var body: some View {
    Text(styled)
      .font(.system(size: size, weight: weight))
      .monospacedDigit()
      .lineLimit(1)
      .minimumScaleFactor(0.45)
      .foregroundStyle(ink ?? style.ink)
      .contentTransition(.numericText(value: Double(value)))
  }

  private var styled: AttributedString {
    var text = text
    for (symbol, range) in text.runs[\.numberSymbol] where symbol == .currency {
      text[range].swiftUI.font = .system(size: size * symbolScale, weight: weight)
      text[range].swiftUI.foregroundColor = style.ink2
    }
    return text
  }
}

extension HeroReadout {
  /// The screen's metric, MRR or ARR.
  init(_ figures: ScreenFigures, style: ScreenStyle, size: CGFloat, compact: Bool = false) {
    self.init(
      text: figures.format.attributedAmount(figures.value, compact: compact),
      value: figures.value,
      style: style,
      size: size
    )
  }
}

import SwiftUI

/// A tiny label in uppercase monospaced letters, spaced wide like an instrument's: "MRR", "GOAL",
/// "TODAY", in the screen's language. Dim unless its caller says otherwise.
struct TelemetryLabel: View {
  let text: String
  let locale: Locale
  var size: CGFloat = 10
  /// Amounts keep their case: "10 k€" is not "10 K€".
  var uppercased = true
  /// Follows Dynamic Type, as the caption it stands for.
  @ScaledMetric(relativeTo: .caption2) private var scale: CGFloat = 1

  init(_ text: String, locale: Locale, size: CGFloat = 10, uppercased: Bool = true) {
    self.text = text
    self.locale = locale
    self.size = size
    self.uppercased = uppercased
  }

  var body: some View {
    // Uppercased in the screen's language, which `textCase` would leave to the device's.
    Text(verbatim: uppercased ? text.uppercased(with: locale) : text)
      .font(Self.font(size: size * scale))
      .tracking(size * scale * 0.16)
      .lineLimit(1)
  }

  static func font(size: CGFloat) -> Font {
    .system(size: size, weight: .semibold, design: .monospaced)
  }
}

import SwiftUI

extension View {
  /// An elevated surface over the screen's background, edged with a hairline: Liquid Glass where
  /// the watch has it.
  func watchCard(style: ScreenStyle, cornerRadius: CGFloat = 18, tint: Double = 0) -> some View {
    modifier(WatchCard(style: style, cornerRadius: cornerRadius, tint: tint))
  }
}

private struct WatchCard: ViewModifier {
  let style: ScreenStyle
  let cornerRadius: CGFloat
  /// How much of the accent washes the surface.
  let tint: Double

  func body(content: Content) -> some View {
    let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
    content
      .background {
        shape.fill(
          LinearGradient(
            colors: [style.glow.opacity(tint), style.ink.opacity(0.07)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
        )
      }
      .overlay { shape.strokeBorder(style.ink.opacity(0.09), lineWidth: 1) }
      .clipShape(shape)
      .glass(in: shape)
  }
}

private extension View {
  @ViewBuilder
  func glass(in shape: some Shape) -> some View {
    if #available(watchOS 26.0, *) {
      glassEffect(.regular, in: shape)
    } else {
      self
    }
  }
}

import SwiftUI

/// The theme's background, lit by the accent from behind the number.
struct ScreenBackground: View {
  let style: ScreenStyle

  var body: some View {
    ZStack {
      style.background
      RadialGradient(
        colors: [style.glow.opacity(style.theme == .dark ? 0.2 : 0.14), .clear],
        center: UnitPoint(x: 0.15, y: 0.4),
        startRadius: 0,
        endRadius: 180
      )
    }
  }
}

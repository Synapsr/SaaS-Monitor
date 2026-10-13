import SwiftUI

/// The theme's background, lit by the accent from the top as on the wall, over a faint dot grid
/// that fades away from the hero: an instrument's face.
struct TelemetryBackground: View {
  let style: ScreenStyle
  /// Where the glow comes from.
  var glowCenter: UnitPoint = .top
  var glowRadius: CGFloat = 220
  var showsGrid = true

  @Environment(\.isLuminanceReduced) private var isLuminanceReduced

  var body: some View {
    ZStack {
      style.background
      if !isLuminanceReduced {
        RadialGradient(
          colors: [style.glow.opacity(style.theme == .dark ? 0.3 : 0.16), style.glow.opacity(0)],
          center: glowCenter,
          startRadius: 0,
          endRadius: glowRadius
        )
        if showsGrid {
          DotGrid(spacing: 9, radius: 0.55)
            .fill(style.ink.opacity(0.05))
            .mask(LinearGradient(colors: [.white, .white.opacity(0)], startPoint: .top, endPoint: .bottom))
        }
      }
    }
  }
}

/// Dots on a square grid, the size of a pixel or so.
struct DotGrid: Shape {
  var spacing: CGFloat
  var radius: CGFloat

  func path(in rect: CGRect) -> Path {
    var path = Path()
    var y = spacing / 2
    while y < rect.height {
      var x = spacing / 2
      while x < rect.width {
        path.addEllipse(in: CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2))
        x += spacing
      }
      y += spacing
    }
    return path
  }
}

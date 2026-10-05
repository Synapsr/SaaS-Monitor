import SwiftUI

/// A screen's colors: its theme's inks and surfaces (`wall-palette.css`, `d/display.css`) and its
/// accent. Never a hard-coded white or black: every color comes from the theme.
struct ScreenStyle: Sendable {
  let theme: ScreenSettings.Theme
  private let accent: String
  private let palette: AccentPalette

  init(accent: String, theme: ScreenSettings.Theme) {
    self.theme = theme
    self.accent = accent
    palette = AccentPalette.of(accent, theme: theme)
  }

  /// The same accent on the dark theme: where the system removes a widget's background (StandBy,
  /// CarPlay), its content sits on black, whatever the screen's theme.
  var onDark: ScreenStyle { theme == .dark ? self : ScreenStyle(accent: accent, theme: .dark) }

  var background: Color { Color(hex: AccentPalette.background(theme)) }
  var ink: Color { Color(hex: theme == .dark ? "#f4f5f7" : "#0b0d10") }
  var ink2: Color { Color(hex: theme == .dark ? "#a8adb5" : "#4a505a") }
  var ink3: Color { Color(hex: theme == .dark ? "#80858e" : "#646b76") }
  /// Neutral chips and tracks.
  var fill: Color { theme == .dark ? Color(hex: "#ffffff").opacity(0.06) : Color(hex: "#0c0e14").opacity(0.05) }

  var glow: Color { Color(hex: palette.glow) }
  var glowInk: Color { Color(hex: palette.ink) }
  var glowDeep: Color { Color(hex: palette.deep) }
  /// The accent's wash, behind accent text.
  var glowWash: Color { Color(hex: palette.glow).opacity(AccentPalette.washAmount) }
}

extension Color {
  /// A `#rrggbb` color, in sRGB.
  init(hex: String) {
    let rgb = ColorMath.rgb(hex: hex) ?? .zero
    self.init(.sRGB, red: rgb.x, green: rgb.y, blue: rgb.z)
  }
}

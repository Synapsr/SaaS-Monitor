import Foundation

/// The colors a screen draws its accent with, on one theme (`src/lib/display/accents.ts`): presets
/// tuned by hand, and custom colors made lighter on the dark screen, or darker on the light one,
/// only as much as their contrast needs.
struct AccentPalette: Sendable {
  /// The accent itself: progress, live marks. Stands out from the background.
  let glow: String
  /// Accent text and small marks: readable on the background and on the accent's wash.
  let ink: String
  /// A deeper shade, for the far end of gradients.
  let deep: String

  static func of(_ accent: String, theme: ScreenSettings.Theme) -> AccentPalette {
    if let preset = presets[accent] { return theme == .dark ? preset.dark : preset.light }
    if ColorMath.rgb(hex: accent) != nil { return derived(from: accent.lowercased(), theme: theme) }
    return theme == .dark ? emerald.dark : emerald.light
  }

  /// Background of each theme, which accents must stand out from (`wall-palette.css`).
  static func background(_ theme: ScreenSettings.Theme) -> String {
    theme == .dark ? "#08090b" : "#f4f5f7"
  }

  /// How much of the accent tints its wash, behind accent text.
  static let washAmount = 0.14

  // MARK: - Presets

  private typealias Preset = (dark: AccentPalette, light: AccentPalette)

  private static let emerald: Preset = (
    AccentPalette(glow: "#34d399", ink: "#6ee7b7", deep: "#059669"),
    AccentPalette(glow: "#059669", ink: "#065f46", deep: "#047857")
  )

  private static let presets: [String: Preset] = [
    "emerald": emerald,
    "violet": (
      AccentPalette(glow: "#a78bfa", ink: "#c4b5fd", deep: "#7c3aed"),
      AccentPalette(glow: "#8b5cf6", ink: "#6d28d9", deep: "#7c3aed")
    ),
    "sky": (
      AccentPalette(glow: "#38bdf8", ink: "#7dd3fc", deep: "#0284c7"),
      AccentPalette(glow: "#0284c7", ink: "#0369a1", deep: "#075985")
    ),
    "amber": (
      AccentPalette(glow: "#fbbf24", ink: "#fcd34d", deep: "#d97706"),
      AccentPalette(glow: "#d57400", ink: "#92400e", deep: "#b45309")
    ),
    "rose": (
      AccentPalette(glow: "#fb7185", ink: "#fda4af", deep: "#e11d48"),
      AccentPalette(glow: "#f43f5e", ink: "#be123c", deep: "#e11d48")
    ),
  ]

  // MARK: - Custom colors

  /// Contrast every palette keeps with its background: WCAG's 3:1 for graphics and 4.5:1 for
  /// text, and much more on the dark screen, where the accent is meant to glow.
  private static func contrast(_ theme: ScreenSettings.Theme) -> (glow: Double, ink: Double) {
    theme == .dark ? (7, 7) : (3, 4.5)
  }

  private static func derived(from seed: String, theme: ScreenSettings.Theme) -> AccentPalette {
    guard let color = ColorMath.oklch(hex: seed) else { return of("emerald", theme: theme) }
    let background = background(theme)
    let contrast = contrast(theme)
    let direction: Double = theme == .dark ? 1 : -1
    let glow = withContrast(color, against: background, ratio: contrast.glow, step: 0.01 * direction)
    let glowHex = ColorMath.hex(glow)
    let wash = ColorMath.mix(glowHex, over: background, amount: washAmount)
    // The ink starts a step past the glow, towards more contrast: lighter text on the dark screen.
    let ink = withContrast(shade(glow, lightness: 0.08 * direction, chroma: 0.85), against: wash, ratio: contrast.ink, step: 0.01 * direction)
    let deep = shade(glow, lightness: theme == .dark ? -0.17 : -0.08, chroma: 0.9)
    return AccentPalette(glow: glowHex, ink: ColorMath.hex(ink), deep: ColorMath.hex(deep))
  }

  /// Moves `color` darker (`step` < 0) or lighter until it contrasts enough with `background`.
  /// The hue and the chroma stay, so the color still looks like the one picked.
  private static func withContrast(_ color: ColorMath.Oklch, against background: String, ratio: Double, step: Double) -> ColorMath.Oklch {
    var adjusted = color
    while ColorMath.contrastRatio(ColorMath.hex(adjusted), background) < ratio {
      let l = adjusted.l + step
      if l < 0 || l > 1 { break }
      adjusted.l = l
    }
    return adjusted
  }

  private static func shade(_ color: ColorMath.Oklch, lightness: Double, chroma: Double) -> ColorMath.Oklch {
    ColorMath.Oklch(l: min(1, max(0, color.l + lightness)), c: color.c * chroma, h: color.h)
  }
}

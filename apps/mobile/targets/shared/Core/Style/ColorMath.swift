import Foundation

/// Color math for accents (`src/lib/display/color.ts`): hex colors in and out, OKLCH in between,
/// which changes lightness without shifting the hue the eye sees. Formulas by Björn Ottosson.
enum ColorMath {
  /// sRGB channels, 0–1.
  typealias RGB = SIMD3<Double>

  /// A color in OKLCH: lightness 0–1, chroma from 0 (gray) up, hue in degrees.
  struct Oklch: Sendable {
    var l: Double
    var c: Double
    var h: Double
  }

  static func rgb(hex: String) -> RGB? {
    let digits = hex.hasPrefix("#") ? hex.dropFirst() : Substring(hex)
    guard digits.count == 6, let value = UInt32(digits, radix: 16) else { return nil }
    return RGB(
      Double((value >> 16) & 0xFF) / 255,
      Double((value >> 8) & 0xFF) / 255,
      Double(value & 0xFF) / 255
    )
  }

  static func hex(_ rgb: RGB) -> String {
    let channels = [rgb.x, rgb.y, rgb.z].map { Int((min(1, max(0, $0)) * 255).rounded()) }
    return "#" + channels.map { String(format: "%02x", $0) }.joined()
  }

  static func oklch(hex: String) -> Oklch? {
    guard let rgb = rgb(hex: hex) else { return nil }
    let r = toLinear(rgb.x), g = toLinear(rgb.y), b = toLinear(rgb.z)
    let l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    let m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    let s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    let lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    let a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    let bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    let hue = atan2(bAxis, a) * 180 / .pi
    return Oklch(l: lightness, c: hypot(a, bAxis), h: hue < 0 ? hue + 360 : hue)
  }

  /// The hex color closest to `color` that screens can show: out of gamut, the chroma is reduced
  /// until it fits, which keeps the lightness and the hue.
  static func hex(_ color: Oklch) -> String {
    let l = min(1, max(0, color.l))
    var linear = toLinearRGB(Oklch(l: l, c: color.c, h: color.h))
    if !inGamut(linear) {
      var low = 0.0
      var high = color.c
      for _ in 0..<24 {
        let c = (low + high) / 2
        if inGamut(toLinearRGB(Oklch(l: l, c: c, h: color.h))) { low = c } else { high = c }
      }
      linear = toLinearRGB(Oklch(l: l, c: low, h: color.h))
    }
    return hex(RGB(toGamma(linear.x), toGamma(linear.y), toGamma(linear.z)))
  }

  /// WCAG contrast ratio of two colors, from 1 (same) to 21 (black on white).
  static func contrastRatio(_ first: String, _ second: String) -> Double {
    let values = [luminance(first), luminance(second)].sorted(by: >)
    return (values[0] + 0.05) / (values[1] + 0.05)
  }

  /// `color` over `background` at `amount` (0–1) opacity, like `color-mix()` in sRGB.
  static func mix(_ color: String, over background: String, amount: Double) -> String {
    guard let top = rgb(hex: color), let under = rgb(hex: background) else { return color }
    return hex(top * amount + under * (1 - amount))
  }

  private static func luminance(_ hex: String) -> Double {
    guard let rgb = rgb(hex: hex) else { return 0 }
    return 0.2126 * toLinear(rgb.x) + 0.7152 * toLinear(rgb.y) + 0.0722 * toLinear(rgb.z)
  }

  private static func toLinearRGB(_ color: Oklch) -> RGB {
    let radians = color.h * .pi / 180
    let a = color.c * cos(radians)
    let b = color.c * sin(radians)
    let l = pow(color.l + 0.3963377774 * a + 0.2158037573 * b, 3)
    let m = pow(color.l - 0.1055613458 * a - 0.0638541728 * b, 3)
    let s = pow(color.l - 0.0894841775 * a - 1.291485548 * b, 3)
    return RGB(
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    )
  }

  private static func inGamut(_ rgb: RGB) -> Bool {
    [rgb.x, rgb.y, rgb.z].allSatisfy { $0 >= -1e-4 && $0 <= 1 + 1e-4 }
  }

  private static func toLinear(_ channel: Double) -> Double {
    channel <= 0.04045 ? channel / 12.92 : pow((channel + 0.055) / 1.055, 2.4)
  }

  private static func toGamma(_ channel: Double) -> Double {
    channel <= 0.0031308 ? channel * 12.92 : 1.055 * pow(channel, 1 / 2.4) - 0.055
  }
}

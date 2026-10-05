package com.saasmonitor.core.display

import kotlin.math.atan2
import kotlin.math.cbrt
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Color math for custom accents, ported from the web app (`src/lib/display/color.ts`): OKLCH
 * changes lightness without shifting the hue the eye sees. Colors are ARGB [Int]s, opaque. Formulas
 * by Björn Ottosson (https://bottosson.github.io/posts/oklab/).
 */
internal data class Oklch(val l: Double, val c: Double, val h: Double)

private fun channels(color: Int): DoubleArray =
  doubleArrayOf(
    (color shr 16 and 0xff) / 255.0,
    (color shr 8 and 0xff) / 255.0,
    (color and 0xff) / 255.0,
  )

private fun fromChannels(rgb: DoubleArray): Int {
  val (r, g, b) = rgb.map { (it.coerceIn(0.0, 1.0) * 255).roundToInt() }
  return (0xff shl 24) or (r shl 16) or (g shl 8) or b
}

private fun toLinear(channel: Double) =
  if (channel <= 0.04045) channel / 12.92 else ((channel + 0.055) / 1.055).pow(2.4)

private fun toGamma(channel: Double) =
  if (channel <= 0.0031308) channel * 12.92 else 1.055 * channel.pow(1 / 2.4) - 0.055

/** `#rrggbb` (or `rrggbb`) as an opaque ARGB color. */
internal fun parseHexColor(hex: String): Int = (0xff shl 24) or hex.removePrefix("#").toInt(16)

internal fun toOklch(color: Int): Oklch {
  val (r, g, b) = channels(color).map(::toLinear)
  val l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  val m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  val s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  val lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  val a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  val bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  val hue = Math.toDegrees(atan2(bAxis, a))
  return Oklch(lightness, hypot(a, bAxis), if (hue < 0) hue + 360 else hue)
}

private fun linearOf(color: Oklch): DoubleArray {
  val radians = Math.toRadians(color.h)
  val a = color.c * cos(radians)
  val b = color.c * sin(radians)
  val l = (color.l + 0.3963377774 * a + 0.2158037573 * b).pow(3)
  val m = (color.l - 0.1055613458 * a - 0.0638541728 * b).pow(3)
  val s = (color.l - 0.0894841775 * a - 1.291485548 * b).pow(3)
  return doubleArrayOf(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  )
}

private fun inGamut(rgb: DoubleArray) = rgb.all { it >= -1e-4 && it <= 1 + 1e-4 }

/** The closest color screens can show: out of gamut, chroma drops until it fits. */
internal fun fromOklch(color: Oklch): Int {
  val l = color.l.coerceIn(0.0, 1.0)
  var linear = linearOf(color.copy(l = l))
  if (!inGamut(linear)) {
    var low = 0.0
    var high = color.c
    repeat(24) {
      val c = (low + high) / 2
      if (inGamut(linearOf(Oklch(l, c, color.h)))) low = c else high = c
    }
    linear = linearOf(Oklch(l, low, color.h))
  }
  return fromChannels(DoubleArray(3) { toGamma(linear[it]) })
}

/** WCAG relative luminance. */
private fun luminance(color: Int): Double {
  val (r, g, b) = channels(color).map(::toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, from 1 (same) to 21 (black on white). */
internal fun contrastRatio(a: Int, b: Int): Double {
  val (lighter, darker) = listOf(luminance(a), luminance(b)).sortedDescending()
  return (lighter + 0.05) / (darker + 0.05)
}

/** [color] over [background] at [amount] (0–1) opacity, like `color-mix()` in sRGB. */
internal fun mixColors(color: Int, background: Int, amount: Double): Int {
  val over = channels(color)
  val under = channels(background)
  return fromChannels(DoubleArray(3) { over[it] * amount + under[it] * (1 - amount) })
}

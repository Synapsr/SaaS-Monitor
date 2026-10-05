package com.saasmonitor.core.display

import com.saasmonitor.core.state.Theme
import java.util.concurrent.ConcurrentHashMap

/** The colors a screen draws its accent with, on one theme (ARGB, opaque). */
data class AccentPalette(
  /** The accent itself: progress, live dot, glow. Stands out from the background. */
  val glow: Int,
  /** Accent text and small marks: readable on the background and on the accent's wash. */
  val ink: Int,
  /** A deeper shade, for the far end of gradients. */
  val deep: Int,
)

/** The wall display's neutral colors (`wall-palette.css`), which accents are tuned against. */
data class ScreenColors(val background: Int, val ink: Int, val ink2: Int, val ink3: Int) {
  companion object {
    fun of(theme: Theme): ScreenColors =
      when (theme) {
        Theme.DARK ->
          ScreenColors(
            0xFF08090B.toInt(),
            0xFFF4F5F7.toInt(),
            0xFFA8ADB5.toInt(),
            0xFF80858E.toInt(),
          )
        Theme.LIGHT ->
          ScreenColors(
            0xFFF4F5F7.toInt(),
            0xFF0B0D10.toInt(),
            0xFF4A505A.toInt(),
            0xFF646B76.toInt(),
          )
      }
  }
}

/**
 * Accents of screens (`src/lib/display/accents.ts` of the web app): five presets tuned by hand, or
 * a custom `#rrggbb` made lighter on the dark screen, or darker on the light one, only as much as
 * its contrast needs.
 */
object Accents {
  private fun rgb(hex: Long) = hex.toInt()

  private val PRESETS: Map<String, Map<Theme, AccentPalette>> =
    mapOf(
      "emerald" to
        mapOf(
          Theme.DARK to AccentPalette(rgb(0xFF34D399), rgb(0xFF6EE7B7), rgb(0xFF059669)),
          Theme.LIGHT to AccentPalette(rgb(0xFF059669), rgb(0xFF065F46), rgb(0xFF047857)),
        ),
      "violet" to
        mapOf(
          Theme.DARK to AccentPalette(rgb(0xFFA78BFA), rgb(0xFFC4B5FD), rgb(0xFF7C3AED)),
          Theme.LIGHT to AccentPalette(rgb(0xFF8B5CF6), rgb(0xFF6D28D9), rgb(0xFF7C3AED)),
        ),
      "sky" to
        mapOf(
          Theme.DARK to AccentPalette(rgb(0xFF38BDF8), rgb(0xFF7DD3FC), rgb(0xFF0284C7)),
          Theme.LIGHT to AccentPalette(rgb(0xFF0284C7), rgb(0xFF0369A1), rgb(0xFF075985)),
        ),
      "amber" to
        mapOf(
          Theme.DARK to AccentPalette(rgb(0xFFFBBF24), rgb(0xFFFCD34D), rgb(0xFFD97706)),
          Theme.LIGHT to AccentPalette(rgb(0xFFD57400), rgb(0xFF92400E), rgb(0xFFB45309)),
        ),
      "rose" to
        mapOf(
          Theme.DARK to AccentPalette(rgb(0xFFFB7185), rgb(0xFFFDA4AF), rgb(0xFFE11D48)),
          Theme.LIGHT to AccentPalette(rgb(0xFFF43F5E), rgb(0xFFBE123C), rgb(0xFFE11D48)),
        ),
    )

  /** Contrast each palette keeps with its background: much more on the dark screen. */
  private val GLOW_CONTRAST = mapOf(Theme.DARK to 7.0, Theme.LIGHT to 3.0)
  private val INK_CONTRAST = mapOf(Theme.DARK to 7.0, Theme.LIGHT to 4.5)
  /** How much of the accent tints its wash, behind accent text. */
  const val WASH_AMOUNT = 0.14

  private val CUSTOM = Regex("^#[0-9a-fA-F]{6}$")
  private val derived = ConcurrentHashMap<String, AccentPalette>()

  /** The palette of [accent] (a preset name or `#rrggbb`) on [theme]; unknown ones are emerald. */
  fun palette(accent: String, theme: Theme): AccentPalette {
    PRESETS[accent]?.let {
      return it.getValue(theme)
    }
    if (!CUSTOM.matches(accent)) return PRESETS.getValue("emerald").getValue(theme)
    return derived.getOrPut("${accent.lowercase()}:${theme.wire}") {
      derive(parseHexColor(accent), theme)
    }
  }

  private fun derive(seed: Int, theme: Theme): AccentPalette {
    val background = ScreenColors.of(theme).background
    val direction = if (theme == Theme.DARK) 1 else -1
    val glow =
      withContrast(toOklch(seed), background, GLOW_CONTRAST.getValue(theme), 0.01 * direction)
    val glowColor = fromOklch(glow)
    val wash = mixColors(glowColor, background, WASH_AMOUNT)
    // The ink starts a step past the glow, towards more contrast.
    val ink =
      withContrast(
        shade(glow, 0.08 * direction, 0.85),
        wash,
        INK_CONTRAST.getValue(theme),
        0.01 * direction,
      )
    val deep = shade(glow, if (theme == Theme.DARK) -0.17 else -0.08, 0.9)
    return AccentPalette(glow = glowColor, ink = fromOklch(ink), deep = fromOklch(deep))
  }

  /** Moves [color] darker or lighter until it contrasts enough; hue and chroma stay. */
  private fun withContrast(color: Oklch, background: Int, ratio: Double, step: Double): Oklch {
    var adjusted = color
    while (contrastRatio(fromOklch(adjusted), background) < ratio) {
      val l = adjusted.l + step
      if (l < 0 || l > 1) break
      adjusted = adjusted.copy(l = l)
    }
    return adjusted
  }

  private fun shade(color: Oklch, lightness: Double, chroma: Double = 1.0) =
    color.copy(l = (color.l + lightness).coerceIn(0.0, 1.0), c = color.c * chroma)
}

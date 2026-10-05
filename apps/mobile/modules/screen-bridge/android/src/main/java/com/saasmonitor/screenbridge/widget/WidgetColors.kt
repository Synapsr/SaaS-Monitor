package com.saasmonitor.screenbridge.widget

import android.os.Build
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.glance.GlanceTheme
import androidx.glance.color.ColorProvider
import androidx.glance.unit.ColorProvider
import com.saasmonitor.core.display.AccentPalette
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.ScreenColors
import com.saasmonitor.core.state.Theme

/** The colors a widget draws with, resolved from its screen's look and its [WidgetPalette]. */
internal class WidgetColors(
  val background: ColorProvider,
  val ink: ColorProvider,
  val ink2: ColorProvider,
  val ink3: ColorProvider,
  /** The accent itself: the pulse, the goal bar, the glow. */
  val glow: ColorProvider,
  /** Accent text, readable on the background and on [wash]. */
  val accentInk: ColorProvider,
  /** The accent's tint behind good news. */
  val wash: ColorProvider,
  /** Neutral chips and tracks. */
  val fill: ColorProvider,
)

/** Wall colors (`wall-palette.css`, `display.css`): neutral fills over each theme. */
private val FILL = mapOf(Theme.DARK to Color(0x0FFFFFFF), Theme.LIGHT to Color(0x0D0C0E14))
private const val WASH_ALPHA = 0.14f

@Composable
internal fun widgetColors(accent: String, theme: Theme, palette: WidgetPalette): WidgetColors =
  if (palette == WidgetPalette.SYSTEM && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    systemColors(accent)
  } else {
    screenColors(accent, theme)
  }

private fun screenColors(accent: String, theme: Theme): WidgetColors {
  val screen = ScreenColors.of(theme)
  val colors = Accents.palette(accent, theme)
  return WidgetColors(
    background = ColorProvider(Color(screen.background)),
    ink = ColorProvider(Color(screen.ink)),
    ink2 = ColorProvider(Color(screen.ink2)),
    ink3 = ColorProvider(Color(screen.ink3)),
    glow = ColorProvider(Color(colors.glow)),
    accentInk = ColorProvider(Color(colors.ink)),
    wash = ColorProvider(Color(colors.glow).copy(alpha = WASH_ALPHA)),
    fill = ColorProvider(FILL.getValue(theme)),
  )
}

/** Surfaces follow the wallpaper; the accent keeps the screen's, in its light or dark variant. */
@Composable
private fun systemColors(accent: String): WidgetColors {
  val day = Accents.palette(accent, Theme.LIGHT)
  val night = Accents.palette(accent, Theme.DARK)
  val system = GlanceTheme.colors
  return WidgetColors(
    background = system.widgetBackground,
    ink = system.onSurface,
    ink2 = system.onSurfaceVariant,
    ink3 = system.onSurfaceVariant,
    glow = dayNight(day, night) { it.glow },
    accentInk = dayNight(day, night) { it.ink },
    wash =
      ColorProvider(
        Color(day.glow).copy(alpha = WASH_ALPHA),
        Color(night.glow).copy(alpha = WASH_ALPHA),
      ),
    fill = ColorProvider(FILL.getValue(Theme.LIGHT), FILL.getValue(Theme.DARK)),
  )
}

private fun dayNight(day: AccentPalette, night: AccentPalette, color: (AccentPalette) -> Int) =
  ColorProvider(Color(color(day)), Color(color(night)))

package com.saasmonitor.wear.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.state.Theme

/**
 * The wall display on a wrist: black, the wall's inks, near-black surfaces, and the screen's accent
 * as the primary color.
 */
@Composable
fun WearTheme(accent: String = "emerald", content: @Composable () -> Unit) {
  val palette = Accents.palette(accent, Theme.DARK)
  val colorScheme =
    ColorScheme(
      primary = Color(palette.glow),
      primaryDim = Color(palette.deep),
      primaryContainer = Color(palette.deep),
      onPrimary = Color(0xFF08090B),
      onPrimaryContainer = Color(palette.ink),
      surfaceContainerLow = Color(0xFF0F1013),
      surfaceContainer = Color(0xFF15171A),
      surfaceContainerHigh = Color(0xFF1C1F23),
      onSurface = Ink.primary,
      onSurfaceVariant = Ink.secondary,
      outline = Ink.tertiary,
      outlineVariant = Color(0xFF2A2D32),
      background = Color.Black,
      onBackground = Ink.primary,
    )
  MaterialTheme(colorScheme = colorScheme, content = content)
}

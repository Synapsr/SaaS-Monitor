package com.saasmonitor.wear.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.state.Theme

/** The wall display on a wrist: black, with the screen's accent as the primary color. */
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
    )
  MaterialTheme(colorScheme = colorScheme, content = content)
}

/** Good news in the accent's ink, like the wall's growth badge. */
@Composable fun accentInk(accent: String): Color = Color(Accents.palette(accent, Theme.DARK).ink)

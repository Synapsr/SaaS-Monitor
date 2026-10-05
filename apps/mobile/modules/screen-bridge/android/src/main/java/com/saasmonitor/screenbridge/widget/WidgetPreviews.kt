@file:OptIn(ExperimentalGlancePreviewApi::class)

package com.saasmonitor.screenbridge.widget

import androidx.compose.runtime.Composable
import androidx.glance.GlanceTheme
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.Metric
import com.saasmonitor.core.state.Theme

/* Android Studio previews of both widgets, from sample numbers. */

@Composable
private fun Sample(
  theme: Theme = Theme.DARK,
  accent: String = "emerald",
  language: Language = Language.EN,
  metric: Metric = Metric.MRR,
  palette: WidgetPalette = WidgetPalette.SCREEN,
  layout: @Composable (ScreenPresentation, WidgetColors) -> Unit,
) {
  val snapshot =
    SampleSnapshots.acme(accent = accent, theme = theme, language = language, metric = metric)
  GlanceTheme {
    val colors = widgetColors(accent, theme, palette)
    WidgetFrame(colors, onClick = null, glow = true) {
      layout(ScreenPresentation(snapshot), colors)
    }
  }
}

@Preview(widthDp = 160, heightDp = 160)
@Composable
private fun MrrDark() = Sample { presentation, colors ->
  MrrLayout(presentation, colors, null, "Acme Analytics")
}

@Preview(widthDp = 160, heightDp = 160)
@Composable
private fun MrrLightViolet() =
  Sample(theme = Theme.LIGHT, accent = "violet") { presentation, colors ->
    MrrLayout(presentation, colors, null, "Acme Analytics")
  }

@Preview(widthDp = 120, heightDp = 120)
@Composable
private fun MrrNarrowFrenchArr() =
  Sample(language = Language.FR, metric = Metric.ARR, accent = "#ff6b35") { presentation, colors ->
    MrrLayout(presentation, colors, "il y a 2 h", "Acme")
  }

@Preview(widthDp = 320, heightDp = 160)
@Composable
private fun OverviewDark() = Sample { presentation, colors ->
  OverviewLayout(presentation, colors, null, "Acme Analytics")
}

@Preview(widthDp = 320, heightDp = 280)
@Composable
private fun OverviewTallSystemColors() =
  Sample(palette = WidgetPalette.SYSTEM, accent = "sky") { presentation, colors ->
    OverviewLayout(presentation, colors, null, "Acme Analytics")
  }

@Preview(widthDp = 320, heightDp = 200)
@Composable
private fun OverviewGermanLight() =
  Sample(theme = Theme.LIGHT, language = Language.DE, accent = "amber") { presentation, colors ->
    OverviewLayout(presentation, colors, "vor 3 Std.", "Acme Analytics")
  }

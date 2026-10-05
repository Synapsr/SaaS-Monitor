package com.saasmonitor.screenbridge.widget

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.saasmonitor.core.display.ScreenPresentation

/** The small widget: a screen's MRR (or ARR) and its growth over 30 days. */
internal class MrrWidget : ScreenWidget() {
  override val previewSize = DpSize(160.dp, 160.dp)

  @Composable
  override fun Ready(
    presentation: ScreenPresentation,
    colors: WidgetColors,
    updatedAgo: String?,
    name: String?,
  ) = MrrLayout(presentation, colors, updatedAgo, name)
}

@Composable
internal fun MrrLayout(
  presentation: ScreenPresentation,
  colors: WidgetColors,
  updatedAgo: String?,
  name: String?,
) {
  val size = LocalSize.current
  val width = contentWidth(PADDING)
  Column(modifier = GlanceModifier.fillMaxSize()) {
    WidgetHeader(name, colors, trailing = updatedAgo)
    Spacer(GlanceModifier.defaultWeight())
    HeroValue(presentation, colors, width, maxSize = 34f)
    Spacer(GlanceModifier.height(6.dp))
    GrowthPill(presentation, colors, short = width < 150.dp)
    if (size.height >= 150.dp) {
      Spacer(GlanceModifier.height(4.dp))
      Text(
        text = presentation.text.inThirtyDays,
        style = TextStyle(color = colors.ink3, fontSize = 11.sp),
      )
    }
  }
}

private val PADDING = 14.dp

class MrrWidgetReceiver : ScreenWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = MrrWidget()
}

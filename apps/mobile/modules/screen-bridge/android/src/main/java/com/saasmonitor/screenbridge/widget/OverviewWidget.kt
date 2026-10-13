package com.saasmonitor.screenbridge.widget

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.width
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.saasmonitor.core.display.ScreenPresentation

/**
 * The large widget: the small one's numbers, today's revenue, the goal, and the latest activity as
 * the widget grows taller.
 */
internal class OverviewWidget : ScreenWidget() {
  override val previewSize = DpSize(320.dp, 190.dp)

  @Composable
  override fun Ready(
    presentation: ScreenPresentation,
    colors: WidgetColors,
    updatedAgo: String?,
    name: String?,
  ) = OverviewLayout(presentation, colors, updatedAgo, name)
}

@Composable
internal fun OverviewLayout(
  presentation: ScreenPresentation,
  colors: WidgetColors,
  updatedAgo: String?,
  name: String?,
) {
  val height = LocalSize.current.height
  val columnWidth = (contentWidth(PADDING) - GAP) / 2
  val feedRows =
    when {
      height >= 260.dp -> 3
      height >= 175.dp -> 1
      else -> 0
    }
  Column(modifier = GlanceModifier.fillMaxSize()) {
    WidgetHeader(name, colors, trailing = updatedAgo)
    Spacer(GlanceModifier.height(10.dp))
    Row(modifier = GlanceModifier.fillMaxWidth()) {
      Column(modifier = GlanceModifier.defaultWeight()) {
        HeroValue(presentation, colors, columnWidth, maxSize = 32f)
        Spacer(GlanceModifier.height(6.dp))
        GrowthPill(presentation, colors, short = columnWidth < 165.dp)
        Spacer(GlanceModifier.height(4.dp))
        Text(
          text = presentation.text.inThirtyDays,
          style = TextStyle(color = colors.ink3, fontSize = 11.sp),
        )
      }
      Spacer(GlanceModifier.width(GAP))
      Column(modifier = GlanceModifier.defaultWeight()) {
        Figure(presentation.text.revenueToday, presentation.revenueTodayText, colors)
        Spacer(GlanceModifier.height(10.dp))
        GoalProgressBar(presentation, colors, showRemaining = height >= 150.dp)
      }
    }
    if (feedRows > 0 && presentation.feed.isNotEmpty()) {
      Spacer(GlanceModifier.defaultWeight())
      presentation.feed.take(feedRows).forEachIndexed { index, line ->
        if (index > 0) Spacer(GlanceModifier.height(8.dp))
        FeedRow(line, colors)
      }
    }
  }
}

private val PADDING = 14.dp
private val GAP = 14.dp

class OverviewWidgetReceiver : ScreenWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = OverviewWidget()
}

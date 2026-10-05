package com.saasmonitor.screenbridge.widget

import android.os.Build
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.saasmonitor.core.display.FeedIcon
import com.saasmonitor.core.display.FeedLine
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.screenbridge.R
import kotlin.math.min

/* The pieces both widgets are made of, drawn like the wall display: calm, large numbers. */

/** The widget's background, rounded like the launcher's widgets, with the accent's glow. */
@Composable
internal fun WidgetFrame(
  colors: WidgetColors,
  /** `null` in previews. */
  onClick: Action?,
  glow: Boolean,
  padding: Dp = 14.dp,
  content: @Composable () -> Unit,
) {
  val rounded =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      GlanceModifier.cornerRadius(android.R.dimen.system_app_widget_background_radius)
    } else {
      GlanceModifier
    }
  Box(
    modifier =
      GlanceModifier.fillMaxSize()
        .appWidgetBackground()
        .then(rounded)
        .background(colors.background)
        .then(if (onClick != null) GlanceModifier.clickable(onClick) else GlanceModifier)
  ) {
    if (glow) {
      Image(
        provider = ImageProvider(R.drawable.sm_glow),
        contentDescription = null,
        modifier = GlanceModifier.fillMaxSize(),
        contentScale = ContentScale.FillBounds,
        colorFilter = ColorFilter.tint(colors.glow),
      )
    }
    Box(modifier = GlanceModifier.fillMaxSize().padding(padding)) { content() }
  }
}

/** The pulse in the accent, the screen's name, and how old the numbers are when offline. */
@Composable
internal fun WidgetHeader(name: String?, colors: WidgetColors, trailing: String? = null) {
  Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
    Image(
      provider = ImageProvider(R.drawable.sm_pulse),
      contentDescription = null,
      modifier = GlanceModifier.size(width = 15.dp, height = 11.dp),
      colorFilter = ColorFilter.tint(colors.glow),
    )
    Spacer(GlanceModifier.width(6.dp))
    Text(
      text = name.orEmpty(),
      modifier = GlanceModifier.defaultWeight(),
      style = TextStyle(color = colors.ink2, fontSize = 12.sp, fontWeight = FontWeight.Medium),
      maxLines = 1,
    )
    if (trailing != null) {
      Spacer(GlanceModifier.width(6.dp))
      Text(text = trailing, style = TextStyle(color = colors.ink3, fontSize = 11.sp), maxLines = 1)
    }
  }
}

/** "MRR" over the amount, sized from the space and the number of characters, like the hero. */
@Composable
internal fun HeroValue(
  presentation: ScreenPresentation,
  colors: WidgetColors,
  width: Dp,
  maxSize: Float,
) {
  Text(
    text = presentation.metricLabel,
    style = TextStyle(color = colors.ink3, fontSize = 12.sp, fontWeight = FontWeight.Medium),
  )
  val characters = presentation.valueText.length
  val size = min(maxSize, width.value / (characters * 0.6f))
  Text(
    text = presentation.valueText,
    style = TextStyle(color = colors.ink, fontSize = size.sp, fontWeight = FontWeight.Medium),
    maxLines = 1,
  )
}

/** "+$1,120 · +9.9%" on the accent's wash, or neutral when it shrinks; [short] keeps one part. */
@Composable
internal fun GrowthPill(
  presentation: ScreenPresentation,
  colors: WidgetColors,
  short: Boolean = false,
) {
  val text =
    if (short) presentation.growthPercentText ?: presentation.growthAmountText
    else presentation.growthText
  val ink = if (presentation.growing) colors.accentInk else colors.ink2
  Row(
    modifier =
      GlanceModifier.background(if (presentation.growing) colors.wash else colors.fill)
        .cornerRadius(10.dp)
        .padding(horizontal = 7.dp, vertical = 3.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Image(
      provider =
        ImageProvider(
          if (presentation.growing) R.drawable.sm_kind_expansion else R.drawable.sm_kind_contraction
        ),
      contentDescription = null,
      modifier = GlanceModifier.size(13.dp),
      colorFilter = ColorFilter.tint(ink),
    )
    Spacer(GlanceModifier.width(4.dp))
    Text(
      text = text,
      style = TextStyle(color = ink, fontSize = 12.sp, fontWeight = FontWeight.Medium),
      maxLines = 1,
    )
  }
}

/** "Goal $15K MRR · 83%", the bar, and what is left. */
@Composable
internal fun GoalProgressBar(
  presentation: ScreenPresentation,
  colors: WidgetColors,
  showRemaining: Boolean,
) {
  Column(modifier = GlanceModifier.fillMaxWidth()) {
    Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
      Text(
        text = "${presentation.goalTitle} ${presentation.goalTargetText}",
        modifier = GlanceModifier.defaultWeight(),
        style = TextStyle(color = colors.ink2, fontSize = 12.sp),
        maxLines = 1,
      )
      Text(
        text = presentation.goalPercentText,
        style = TextStyle(color = colors.ink2, fontSize = 12.sp, fontWeight = FontWeight.Medium),
      )
    }
    Spacer(GlanceModifier.height(5.dp))
    LinearProgressIndicator(
      progress = presentation.goal.progress,
      modifier = GlanceModifier.fillMaxWidth().height(6.dp).cornerRadius(3.dp),
      color = colors.glow,
      backgroundColor = colors.fill,
    )
    if (showRemaining) {
      Spacer(GlanceModifier.height(4.dp))
      Text(
        text = presentation.goalRemainingText,
        style = TextStyle(color = colors.ink3, fontSize = 11.sp),
        maxLines = 1,
      )
    }
  }
}

/** A label over a figure: "Revenue today", "$1,240". */
@Composable
internal fun Figure(label: String, value: String, colors: WidgetColors) {
  Text(text = label, style = TextStyle(color = colors.ink3, fontSize = 12.sp), maxLines = 1)
  Text(
    text = value,
    style = TextStyle(color = colors.ink, fontSize = 18.sp, fontWeight = FontWeight.Medium),
    maxLines = 1,
  )
}

/** One item of the live feed: its icon, "+$99 MRR", what it is and when. */
@Composable
internal fun FeedRow(line: FeedLine, colors: WidgetColors) {
  Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
    Box(
      modifier =
        GlanceModifier.size(28.dp)
          .background(if (line.isGoodNews) colors.wash else colors.fill)
          .cornerRadius(14.dp),
      contentAlignment = Alignment.Center,
    ) {
      Image(
        provider = ImageProvider(line.icon.drawable),
        contentDescription = line.kindLabel,
        modifier = GlanceModifier.size(15.dp),
        colorFilter = ColorFilter.tint(if (line.isGoodNews) colors.accentInk else colors.ink2),
      )
    }
    Spacer(GlanceModifier.width(10.dp))
    Column(modifier = GlanceModifier.defaultWeight()) {
      Row(verticalAlignment = Alignment.Bottom) {
        Text(
          text = line.headline,
          style =
            TextStyle(
              color = if (line.isGoodNews) colors.ink else colors.ink2,
              fontSize = 14.sp,
              fontWeight = FontWeight.Medium,
            ),
          maxLines = 1,
        )
        if (line.metricSuffix != null) {
          Text(
            text = " ${line.metricSuffix}",
            style =
              TextStyle(color = colors.ink3, fontSize = 11.sp, fontWeight = FontWeight.Medium),
          )
        }
      }
      if (line.details.isNotEmpty()) {
        Text(
          text = line.details,
          style = TextStyle(color = colors.ink2, fontSize = 11.sp),
          maxLines = 1,
        )
      }
    }
    Spacer(GlanceModifier.width(8.dp))
    Text(text = line.time, style = TextStyle(color = colors.ink3, fontSize = 11.sp), maxLines = 1)
  }
}

/** A sentence instead of numbers: a locked or empty screen, or nothing to show yet. */
@Composable
internal fun WidgetMessage(title: String, details: String?, colors: WidgetColors) {
  Column {
    Text(
      text = title,
      style = TextStyle(color = colors.ink, fontSize = 14.sp, fontWeight = FontWeight.Medium),
      maxLines = 3,
    )
    if (details != null) {
      Spacer(GlanceModifier.height(4.dp))
      Text(text = details, style = TextStyle(color = colors.ink3, fontSize = 12.sp), maxLines = 3)
    }
  }
}

/** The widget's size, in dp, inside its padding. */
@Composable internal fun contentWidth(padding: Dp): Dp = LocalSize.current.width - padding * 2

internal val FeedIcon.drawable: Int
  get() =
    when (this) {
      FeedIcon.PAYMENT -> R.drawable.sm_kind_payment
      FeedIcon.CONNECT -> R.drawable.sm_kind_connect
      FeedIcon.CUSTOMER -> R.drawable.sm_kind_customer
      FeedIcon.NEW -> R.drawable.sm_kind_new
      FeedIcon.EXPANSION -> R.drawable.sm_kind_expansion
      FeedIcon.REACTIVATION -> R.drawable.sm_kind_reactivation
      FeedIcon.CONTRACTION -> R.drawable.sm_kind_contraction
      FeedIcon.CHURN -> R.drawable.sm_kind_churn
      FeedIcon.WONT_RENEW -> R.drawable.sm_churn_scheduled
      FeedIcon.UNPAID -> R.drawable.sm_churn_unpaid
      FeedIcon.PAUSED -> R.drawable.sm_churn_paused
    }

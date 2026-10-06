package com.saasmonitor.wear.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.LocalReduceMotion
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.Text
import com.saasmonitor.core.display.AccentPalette
import com.saasmonitor.core.display.FeedIcon
import com.saasmonitor.core.display.MoneyText
import com.saasmonitor.core.display.ScreenPresentation
import java.util.Locale
import kotlinx.coroutines.delay

/* The instrument's vocabulary: telemetry labels, the live dot, the delta chip, the hero readout. */

/** The wall display's neutrals (`wall-palette.css`), on the watch's black. */
internal object Ink {
  val primary = Color(0xFFF4F5F7)
  val secondary = Color(0xFFA8ADB5)
  val tertiary = Color(0xFF80858E)
  /** Card edges: a hairline of ink. */
  val hairline = primary.copy(alpha = 0.09f)
  /** The empty part of gauges. */
  val track = primary.copy(alpha = 0.12f)
}

/** The watch dozes (ambient mode): no color fills, no glow, nothing moves. */
internal val LocalAmbient = compositionLocalOf { false }

/** Whether anything may move: not with reduced motion, not while the watch dozes. */
@Composable
internal fun motionAllowed(): Boolean = !LocalReduceMotion.current && !LocalAmbient.current

/** Digits of the same width, so that numbers don't dance when they change. */
private const val TABULAR = "tnum"

/**
 * "MRR", "GOAL", "TODAY": tiny, uppercase, spaced, monospaced — the labels of an instrument. In the
 * screen's language, uppercased with its rules.
 */
@Composable
internal fun TelemetryLabel(
  text: String,
  locale: Locale,
  modifier: Modifier = Modifier,
  color: Color = Ink.tertiary,
  fontSize: TextUnit = 10.sp,
  textAlign: TextAlign? = null,
  letterSpacing: TextUnit = 0.16.em,
) {
  Text(
    text.uppercase(locale),
    modifier = modifier,
    style = telemetryStyle(fontSize).copy(letterSpacing = letterSpacing),
    color = color,
    maxLines = 1,
    overflow = TextOverflow.Ellipsis,
    textAlign = textAlign,
  )
}

internal fun telemetryStyle(fontSize: TextUnit = 10.sp) =
  TextStyle(
    fontFamily = FontFamily.Monospace,
    fontWeight = FontWeight.Medium,
    fontSize = fontSize,
    letterSpacing = 0.16.em,
    lineHeight = fontSize * 1.3f,
  )

/**
 * The accent's dot with a soft pulsing halo, and the word for live; stale numbers say their age
 * next to a still, dim dot instead.
 */
@Composable
internal fun LiveIndicator(
  live: Boolean,
  label: String,
  accent: AccentPalette,
  locale: Locale,
  modifier: Modifier = Modifier,
) {
  val ambient = LocalAmbient.current
  Row(modifier, verticalAlignment = Alignment.CenterVertically) {
    LiveDot(live, accent)
    Spacer(Modifier.width(4.dp))
    TelemetryLabel(label, locale, color = if (live && !ambient) Color(accent.ink) else Ink.tertiary)
  }
}

/** The accent's dot, its halo pulsing while the numbers are live; still and dim otherwise. */
@Composable
internal fun LiveDot(live: Boolean, accent: AccentPalette, modifier: Modifier = Modifier) {
  val lit = live && !LocalAmbient.current
  Box(modifier.size(12.dp), contentAlignment = Alignment.Center) {
    if (lit && motionAllowed()) Halo(Color(accent.glow))
    Box(Modifier.size(6.dp).background(if (lit) Color(accent.glow) else Ink.tertiary, CircleShape))
  }
}

/**
 * A heartbeat: the halo swells and fades, then rests. It moves through its own layer's properties,
 * so nothing is redrawn or recomposed, and no frame is asked for while it rests.
 */
@Composable
private fun Halo(color: Color) {
  val progress = remember { Animatable(1f) }
  LaunchedEffect(Unit) {
    while (true) {
      progress.snapTo(0f)
      progress.animateTo(1f, tween(PULSE_MILLIS, easing = LinearOutSlowInEasing))
      delay(REST_MILLIS)
    }
  }
  Box(
    Modifier.size(12.dp)
      .graphicsLayer {
        val swell = 0.5f + 0.5f * progress.value
        scaleX = swell
        scaleY = swell
        alpha = 0.6f * (1 - progress.value)
      }
      .background(color, CircleShape)
  )
}

private const val PULSE_MILLIS = 1_400
private const val REST_MILLIS = 1_600L

/**
 * "▲ +1.2 %  30d" on the accent's wash; a loss goes neutral, never alarm red. Without a month of
 * history, the amount.
 */
@Composable
internal fun DeltaChip(
  presentation: ScreenPresentation,
  accent: AccentPalette,
  modifier: Modifier = Modifier,
  /** Narrow places leave the period out: it is the same everywhere. */
  showPeriod: Boolean = true,
) {
  val ambient = LocalAmbient.current
  // No change is no news: neutral, without an arrow pointing anywhere.
  val growing = presentation.growing && !presentation.flat
  val ink = if (growing && !ambient) Color(accent.ink) else Ink.secondary
  val fill =
    when {
      ambient -> Color.Transparent
      growing -> Color(accent.glow).copy(alpha = 0.15f)
      else -> Ink.primary.copy(alpha = 0.08f)
    }
  Row(
    modifier
      .background(fill, CircleShape)
      // Dozing screens draw outlines, not fills.
      .then(if (ambient) Modifier.border(1.dp, Ink.tertiary, CircleShape) else Modifier)
      .padding(horizontal = 9.dp, vertical = 3.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.Center,
  ) {
    if (!presentation.flat)
      Text(
        if (growing) "▲" else "▼",
        style = TextStyle(fontSize = 8.sp),
        color = ink,
        modifier = Modifier.padding(end = 4.dp),
      )
    Text(
      presentation.growthPercentText ?: presentation.growthAmountText,
      style = MaterialTheme.typography.labelMedium.copy(fontFeatureSettings = TABULAR),
      color = ink,
      maxLines = 1,
    )
    if (showPeriod)
      Text(
        presentation.growthPeriodText,
        style = telemetryStyle(9.sp).copy(letterSpacing = 0.06.em),
        color = ink.copy(alpha = 0.7f),
        maxLines = 1,
        modifier = Modifier.padding(start = 6.dp),
      )
  }
}

/**
 * An amount as the hero of a surface: tabular digits, the currency symbol smaller and dimmer when
 * ICU says where it is, shrunk to fit one line. When [value] changes, the number rolls: up for a
 * rise, down for a drop; it simply changes with reduced motion.
 */
@Composable
internal fun HeroAmount(
  money: MoneyText,
  value: Long,
  modifier: Modifier = Modifier,
  style: TextStyle = MaterialTheme.typography.numeralMedium,
  minSize: TextUnit = 22.sp,
  color: Color = Ink.primary,
) {
  // Dozing, big white digits would glare: dimmer and lighter.
  val ambient = LocalAmbient.current
  val animate = motionAllowed()
  val textStyle =
    style.copy(
      color = if (ambient) Ink.secondary else color,
      fontWeight = if (ambient) FontWeight.Normal else FontWeight.SemiBold,
      fontFeatureSettings = TABULAR,
      textAlign = TextAlign.Center,
    )
  AnimatedContent(
    targetState = money to value,
    modifier = modifier,
    contentKey = { it.first.text },
    transitionSpec = {
      if (!animate) EnterTransition.None togetherWith ExitTransition.None
      else {
        val rise = targetState.second >= initialState.second
        val enter =
          slideInVertically(tween(420)) { if (rise) it / 2 else -it / 2 } + fadeIn(tween(420))
        val exit =
          slideOutVertically(tween(300)) { if (rise) -it / 2 else it / 2 } + fadeOut(tween(240))
        (enter togetherWith exit).using(SizeTransform(clip = true))
      }
    },
    contentAlignment = Alignment.Center,
    label = "amount",
  ) { (shown, _) ->
    BasicText(
      remember(shown) { heroText(shown) },
      style = textStyle,
      maxLines = 1,
      autoSize = TextAutoSize.StepBased(minFontSize = minSize, maxFontSize = style.fontSize),
    )
  }
}

private fun heroText(money: MoneyText): AnnotatedString = buildAnnotatedString {
  append(money.text)
  money.symbol?.let {
    addStyle(SpanStyle(fontSize = 0.6.em, color = Ink.secondary), it.first, it.last + 1)
  }
}

/**
 * What happened, as an icon in a circle of the accent: good news glows ([glowing] adds a halo, for
 * moments), losses stay neutral.
 */
@Composable
internal fun EventBadge(
  icon: FeedIcon,
  good: Boolean,
  accent: AccentPalette,
  size: Dp,
  contentDescription: String?,
  glowing: Boolean = false,
) {
  val ambient = LocalAmbient.current
  val lit = good && !ambient
  val glow = Color(accent.glow)
  Box(
    Modifier.size(size)
      .then(
        if (lit && glowing)
          Modifier.drawBehind {
            drawCircle(
              Brush.radialGradient(
                listOf(glow.copy(alpha = 0.45f), Color.Transparent),
                center,
                this.size.minDimension,
              ),
              radius = this.size.minDimension,
            )
          }
        else Modifier
      )
      .background(
        when {
          ambient -> Color.Black
          good -> glow.copy(alpha = 0.16f)
          else -> Ink.primary.copy(alpha = 0.07f)
        },
        CircleShape,
      )
      .border(
        Dp.Hairline,
        if (lit) glow.copy(alpha = 0.45f) else Ink.primary.copy(alpha = 0.14f),
        CircleShape,
      ),
    contentAlignment = Alignment.Center,
  ) {
    Icon(
      painter = painterResource(icon.drawable),
      contentDescription = contentDescription,
      tint = if (lit) Color(accent.ink) else Ink.secondary,
      modifier = Modifier.size(size * 0.5f),
    )
  }
}

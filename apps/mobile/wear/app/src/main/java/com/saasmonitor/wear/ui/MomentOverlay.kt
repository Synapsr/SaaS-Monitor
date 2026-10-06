package com.saasmonitor.wear.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.CurvedLayout
import androidx.wear.compose.foundation.CurvedModifier
import androidx.wear.compose.foundation.CurvedTextStyle
import androidx.wear.compose.foundation.basicCurvedText
import androidx.wear.compose.foundation.sizeIn
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.Text
import androidx.wear.tooling.preview.devices.WearDevices
import com.saasmonitor.core.display.AccentPalette
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.moments.Moment
import com.saasmonitor.core.moments.MomentCard
import com.saasmonitor.core.state.Theme
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

/**
 * What just happened, over the whole watch face of the app for a few seconds, like a wall display's
 * moment card: a burst of the accent, the event in a glowing circle, the amount in large, who and
 * what. It springs in; tapping it moves on.
 */
@Composable
fun MomentOverlay(moment: WatchMoment?, onDismiss: (String) -> Unit) {
  val context = LocalContext.current
  val animate = motionAllowed()
  LaunchedEffect(moment?.id) { moment?.let { MomentHaptics.play(context, it.card.celebration) } }
  // The black stays while moments follow each other: only their content changes.
  AnimatedVisibility(visible = moment != null, enter = fadeIn(), exit = fadeOut()) {
    Box(Modifier.fillMaxSize().background(Color.Black)) {
      AnimatedContent(
        targetState = moment,
        contentKey = { it?.id },
        transitionSpec = {
          val enter =
            if (animate)
              fadeIn(tween(durationMillis = 220)) +
                scaleIn(
                  spring(dampingRatio = 0.6f, stiffness = Spring.StiffnessMediumLow),
                  initialScale = 0.8f,
                )
            else fadeIn(tween(durationMillis = 220))
          enter togetherWith fadeOut(tween(durationMillis = 120))
        },
        label = "moment",
      ) { shown ->
        if (shown != null) WearTheme(accent = shown.accent) { Moment(shown, onDismiss) }
      }
    }
  }
}

@Composable
private fun Moment(moment: WatchMoment, onDismiss: (String) -> Unit) {
  val card = moment.card
  val accent = Accents.palette(moment.accent, Theme.DARK)
  val celebrate = card.celebration && !LocalAmbient.current
  Box(
    modifier =
      Modifier.fillMaxSize().background(Color.Black).clickable(
        interactionSource = remember { MutableInteractionSource() },
        indication = null,
      ) {
        onDismiss(moment.id)
      },
    contentAlignment = Alignment.Center,
  ) {
    // Losses are said plainly: no burst, no glow.
    if (celebrate) Burst(accent, Modifier.fillMaxSize())
    // A milestone fills the ring to the full and lights it.
    if (moment.isMilestone)
      GoalRing(1f, accent, Modifier.fillMaxSize(), gapDegrees = 0f, ticks = false)
    // The screen's name along the top of the bezel: the middle keeps its height for the news.
    CurvedLayout(Modifier.fillMaxSize().padding(14.dp), anchor = 270f) {
      basicCurvedText(
        listOfNotNull(moment.screenName, card.account)
          .joinToString(" · ")
          .uppercase(moment.language.locale),
        style = CurvedTextStyle(telemetryStyle(10.sp).copy(color = Ink.tertiary)),
        modifier = CurvedModifier.sizeIn(maxSweepDegrees = 120f),
        overflow = TextOverflow.Ellipsis,
      )
    }
    // Between the curved name and the bottom of the bezel, where the circle is wide enough.
    Box(
      Modifier.fillMaxSize().padding(start = 24.dp, end = 24.dp, top = 31.dp, bottom = 26.dp),
      contentAlignment = Alignment.Center,
    ) {
      FitInWindow {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
          EventBadge(
            card.icon,
            good = card.celebration,
            accent = accent,
            size = 30.dp,
            contentDescription = null,
            glowing = true,
          )
          Spacer(Modifier.height(4.dp))
          Text(
            card.eyebrow,
            style = MaterialTheme.typography.titleSmall,
            color = if (celebrate) Color(accent.ink) else Ink.secondary,
            textAlign = TextAlign.Center,
            maxLines = 2,
          )
          Headline(card, celebrate)
          if (card.details.isNotEmpty()) {
            // Up to three lines, a step smaller rather than cut: a moment reads in full.
            val style = MaterialTheme.typography.bodySmall
            BasicText(
              card.details,
              style = style.copy(color = Ink.secondary, textAlign = TextAlign.Center),
              maxLines = 3,
              autoSize = TextAutoSize.StepBased(minFontSize = 10.sp, maxFontSize = style.fontSize),
              modifier = Modifier.padding(horizontal = 2.dp),
            )
          }
          card.footnote?.let { footnote ->
            Spacer(Modifier.height(6.dp))
            Footnote(footnote, celebrate, accent)
          }
        }
      }
    }
  }
}

/**
 * "Your fee: $3", "Ends October 29" on the accent's wash: on one line when a step smaller does it,
 * else on two, as the bottom of the circle is narrow.
 */
@Composable
private fun Footnote(text: String, celebrate: Boolean, accent: AccentPalette) {
  val style =
    MaterialTheme.typography.labelSmall.copy(
      color = if (celebrate) Color(accent.ink) else Ink.secondary,
      textAlign = TextAlign.Center,
    )
  val measurer = rememberTextMeasurer()
  BoxWithConstraints(Modifier.padding(horizontal = 12.dp)) {
    val inner = 8.dp
    val width = with(LocalDensity.current) { (maxWidth - inner * 2).roundToPx() }
    val fitsOneLine =
      remember(text, width) {
        !measurer
          .measure(
            text,
            style.copy(fontSize = 10.sp),
            maxLines = 1,
            constraints = Constraints(maxWidth = width),
          )
          .hasVisualOverflow
      }
    BasicText(
      text,
      style = style,
      maxLines = if (fitsOneLine) 1 else 2,
      autoSize = TextAutoSize.StepBased(minFontSize = 10.sp, maxFontSize = style.fontSize),
      modifier =
        Modifier.background(
            if (celebrate) Color(accent.glow).copy(alpha = 0.15f)
            else Ink.primary.copy(alpha = 0.08f),
            RoundedCornerShape(12.dp),
          )
          .padding(horizontal = inner, vertical = 3.dp),
    )
  }
}

/**
 * [content] centered in the space it is given, and shrunk a little when it would be taller, so
 * that nothing meets the bezel.
 */
@Composable
private fun FitInWindow(content: @Composable () -> Unit) {
  Layout(content) { measurables, constraints ->
    val unbounded = constraints.copy(minHeight = 0, maxHeight = Constraints.Infinity)
    val placeable = measurables.single().measure(unbounded)
    val limit = constraints.maxHeight
    val scale =
      if (placeable.height <= limit) 1f else max(MIN_SCALE, limit.toFloat() / placeable.height)
    val height = min(placeable.height, limit)
    layout(placeable.width, height) {
      placeable.placeWithLayer(0, (height - placeable.height) / 2) {
        scaleX = scale
        scaleY = scale
      }
    }
  }
}

/** Text shrinks this much at most: smaller would no longer read at a glance. */
private const val MIN_SCALE = 0.82f

/** The amount as a hero readout, shrunk to fit one line; a name on two lines at most. */
@Composable
private fun Headline(card: MomentCard, celebrate: Boolean) {
  val color = if (celebrate) Ink.primary else Ink.secondary
  if (card.headlineIsName) {
    // A name is read in full: on two lines, a step smaller if it has to.
    val style = MaterialTheme.typography.titleLarge
    BasicText(
      card.headline,
      style = style.copy(color = color, textAlign = TextAlign.Center),
      maxLines = 2,
      autoSize = TextAutoSize.StepBased(minFontSize = 13.sp, maxFontSize = style.fontSize),
    )
    return
  }
  Row(verticalAlignment = Alignment.Bottom) {
    BasicText(
      remember(card.headline) { smallSymbol(card.headline) },
      style =
        MaterialTheme.typography.numeralMedium.copy(
          color = color,
          fontWeight = FontWeight.SemiBold,
          fontFeatureSettings = "tnum",
        ),
      maxLines = 1,
      autoSize = TextAutoSize.StepBased(minFontSize = 20.sp, maxFontSize = 40.sp),
      modifier = Modifier.weight(1f, fill = false),
    )
    card.metric?.let {
      Spacer(Modifier.width(4.dp))
      Text(
        it,
        style = telemetryStyle(10.sp),
        color = Ink.tertiary,
        modifier = Modifier.padding(bottom = 8.dp),
      )
    }
  }
}

/**
 * The accent bursting from the middle: a glow that swells, a ring and rays flying out once. Only
 * the glow with reduced motion.
 */
@Composable
private fun Burst(accent: AccentPalette, modifier: Modifier) {
  val animate = motionAllowed()
  val progress = remember { Animatable(if (animate) 0f else 1f) }
  LaunchedEffect(Unit) {
    if (animate) progress.animateTo(1f, tween(1_200, easing = FastOutSlowInEasing))
  }
  val glow = Color(accent.glow)
  Canvas(modifier) {
    val p = progress.value
    val radius = size.minDimension / 2
    drawCircle(
      Brush.radialGradient(
        listOf(glow.copy(alpha = 0.34f), glow.copy(alpha = 0.08f), Color.Transparent),
        center,
        radius * (0.55f + 0.4f * p),
      ),
      radius = radius * (0.55f + 0.4f * p),
    )
    if (!animate || p >= 1f) return@Canvas
    val fade = (1 - p).pow(1.4f)
    drawCircle(
      glow.copy(alpha = 0.5f * fade),
      radius = radius * (0.16f + 0.8f * p),
      style = Stroke(1.5.dp.toPx()),
    )
    for (ray in 0 until RAYS) {
      val angle = Math.toRadians(ray * 360.0 / RAYS + 360.0 / RAYS / 2)
      val direction = Offset(cos(angle).toFloat(), sin(angle).toFloat())
      val from = radius * (0.22f + 0.55f * p)
      val length = radius * (if (ray % 2 == 0) 0.14f else 0.08f) * (1 - 0.6f * p)
      drawLine(
        glow.copy(alpha = 0.85f * fade),
        center + direction * from,
        center + direction * (from + length),
        strokeWidth = 2.dp.toPx(),
        cap = StrokeCap.Round,
      )
    }
  }
}

private const val RAYS = 16

/**
 * The amount with its currency symbol smaller and dimmer, like the hero readout. The card only
 * has the written amount: symbols are found by their Unicode category, and a symbol written in
 * letters ("CHF") simply stays the size of the digits.
 */
private fun smallSymbol(amount: String): AnnotatedString = buildAnnotatedString {
  append(amount)
  amount.forEachIndexed { index, char ->
    if (Character.getType(char) == Character.CURRENCY_SYMBOL.toInt()) {
      var from = index
      var to = index + 1
      while (from > 0 && Character.isSpaceChar(amount[from - 1])) from--
      while (to < amount.length && Character.isSpaceChar(amount[to])) to++
      addStyle(SpanStyle(fontSize = 0.6.em, color = Ink.secondary), from, to)
    }
  }
}

@Preview(device = WearDevices.LARGE_ROUND, showSystemUi = true)
@Composable
private fun PaymentMomentPreview() {
  val state = SampleSnapshots.acme()
  MomentOverlay(
    WatchMoment(
      "p",
      "Acme Analytics",
      "emerald",
      Language.EN,
      MomentCard.of(Moment.Payment(state.feed[0]), state),
      false,
    ),
    onDismiss = {},
  )
}

@Preview(device = WearDevices.SMALL_ROUND, showSystemUi = true)
@Composable
private fun ChurnMomentPreview() {
  val state = SampleSnapshots.acme()
  MomentOverlay(
    WatchMoment(
      "c",
      "Acme Analytics",
      "emerald",
      Language.EN,
      MomentCard.of(Moment.Movement(state.feed[4]), state),
      false,
    ),
    onDismiss = {},
  )
}

package com.saasmonitor.wear.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PointMode
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.saasmonitor.core.display.AccentPalette
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.sin

/* The gauges of the instrument: the goal ring, the sparkline, the goal bar, the glow behind. */

/**
 * The goal as a gauge along the bezel: a faint track, the progress in the accent from its deep
 * shade to its glow, round caps and a glowing tip. [gapDegrees] leaves the top to the time. It
 * fills once when it appears, still with reduced motion; dozing, it is a thin gray line.
 */
@Composable
internal fun GoalRing(
  progress: Float,
  accent: AccentPalette,
  modifier: Modifier = Modifier,
  gapDegrees: Float = 84f,
  strokeWidth: Dp = 6.dp,
  inset: Dp = 3.dp,
  ticks: Boolean = true,
) {
  val ambient = LocalAmbient.current
  val shown = animatedOnce(progress.coerceIn(0f, 1f), durationMillis = 1_100)
  Canvas(modifier) {
    val stroke = strokeWidth.toPx()
    val radius = size.minDimension / 2 - inset.toPx() - stroke / 2
    val topLeft = center - Offset(radius, radius)
    val arcSize = Size(radius * 2, radius * 2)
    val start = 270f + gapDegrees / 2
    val total = 360f - gapDegrees
    val sweep = total * shown()
    if (ambient) {
      if (sweep > 0.5f)
        drawArc(
          Ink.tertiary,
          start,
          sweep,
          useCenter = false,
          topLeft = topLeft,
          size = arcSize,
          style = Stroke(1.5.dp.toPx(), cap = StrokeCap.Round),
        )
      return@Canvas
    }
    drawArc(
      Ink.track,
      start,
      total,
      useCenter = false,
      topLeft = topLeft,
      size = arcSize,
      style = Stroke(stroke, cap = StrokeCap.Round),
    )
    if (ticks) drawTicks(start, total, radius - stroke / 2 - 4.dp.toPx())
    if (sweep <= 0.5f) return@Canvas
    val glow = Color(accent.glow)
    rotate(start, pivot = center) {
      // Angle 0 is the start of the arc here: the gradient runs along the progress only.
      val brush =
        Brush.sweepGradient(
          0f to Color(accent.deep),
          sweep / 360f to glow,
          1f to Color(accent.deep),
          center = center,
        )
      drawArc(
        brush,
        0f,
        sweep,
        useCenter = false,
        topLeft = topLeft,
        size = arcSize,
        alpha = 0.2f,
        style = Stroke(stroke * 2.4f, cap = StrokeCap.Round),
      )
      drawArc(
        brush,
        0f,
        sweep,
        useCenter = false,
        topLeft = topLeft,
        size = arcSize,
        style = Stroke(stroke, cap = StrokeCap.Round),
      )
    }
    val angle = Math.toRadians((start + sweep).toDouble())
    glowingTip(
      center + Offset((cos(angle) * radius).toFloat(), (sin(angle) * radius).toFloat()),
      glow,
      Color(accent.ink),
      stroke,
    )
  }
}

/** Faint graduations every tenth of the gauge, inside it: an instrument, not a loading bar. */
private fun DrawScope.drawTicks(start: Float, total: Float, radius: Float) {
  val length = 3.dp.toPx()
  for (step in 1..9) {
    val angle = Math.toRadians((start + total * step / 10).toDouble())
    val direction = Offset(cos(angle).toFloat(), sin(angle).toFloat())
    drawLine(
      Ink.primary.copy(alpha = if (step == 5) 0.22f else 0.12f),
      center + direction * radius,
      center + direction * (radius - length),
      strokeWidth = 1.dp.toPx(),
      cap = StrokeCap.Round,
    )
  }
}

/** The end of a gauge: a soft glow of the accent around a bright point. */
private fun DrawScope.glowingTip(at: Offset, glow: Color, ink: Color, stroke: Float) {
  val halo = stroke * 2.6f
  drawCircle(
    Brush.radialGradient(listOf(glow.copy(alpha = 0.75f), Color.Transparent), at, halo),
    radius = halo,
    center = at,
  )
  drawCircle(ink, radius = stroke * 0.3f, center = at)
}

/**
 * The series as a smooth line in the accent over a fill fading to nothing, its last point glowing.
 * It draws itself in once, from the left; still with reduced motion. Nothing below two points.
 */
@Composable
internal fun Sparkline(
  values: List<Long>,
  accent: AccentPalette,
  modifier: Modifier = Modifier,
  lineWidth: Dp = 2.dp,
  /** Share of the height the curve spans, from the top: the rest is fill. */
  curveHeight: Float = 0.6f,
  dot: Boolean = true,
  fillAlpha: Float = 0.3f,
) {
  if (values.size < 2) {
    Box(modifier)
    return
  }
  val ambient = LocalAmbient.current
  val reveal = animatedOnce(1f, durationMillis = 900, from = 0f)
  // The curve is built once per size and series; frames of the draw-in only clip it.
  Spacer(
    modifier.drawWithCache {
      val margin = if (dot) 4.dp.toPx() else lineWidth.toPx()
      val top = margin
      val span = (size.height - top) * curveHeight
      val low = values.min()
      val high = values.max()
      val points =
        values.mapIndexed { index, value ->
          val x = margin + (size.width - 2 * margin) * index / (values.size - 1)
          val share = if (high == low) 0.5f else (value - low).toFloat() / (high - low)
          Offset(x, top + span * (1 - share))
        }
      val line = monotonePath(points)
      val area =
        Path().apply {
          addPath(line)
          lineTo(points.last().x, size.height)
          lineTo(points.first().x, size.height)
          close()
        }
      val glow = Color(accent.glow)
      val fill =
        Brush.verticalGradient(
          listOf(glow.copy(alpha = fillAlpha), Color.Transparent),
          startY = top,
          endY = size.height,
        )
      val stroke =
        Stroke(
          if (ambient) 1.5.dp.toPx() else lineWidth.toPx(),
          cap = StrokeCap.Round,
          join = StrokeJoin.Round,
        )
      onDrawBehind {
        clipRect(right = size.width * reveal()) {
          if (!ambient) drawPath(area, fill)
          drawPath(line, if (ambient) Ink.tertiary else glow, style = stroke)
        }
        if (dot && !ambient && reveal() > 0.98f)
          glowingTip(points.last(), glow, Color(accent.ink), lineWidth.toPx() * 1.6f)
      }
    }
  )
}

/** A path through [points] that never overshoots them (monotone cubic, Fritsch–Carlson). */
internal fun monotonePath(points: List<Offset>): Path {
  val path = Path()
  if (points.isEmpty()) return path
  path.moveTo(points[0].x, points[0].y)
  val tangents = monotoneTangents(points.map { it.x }, points.map { it.y })
  for (i in 0 until points.size - 1) {
    val from = points[i]
    val to = points[i + 1]
    val third = (to.x - from.x) / 3
    path.cubicTo(
      from.x + third,
      from.y + tangents[i] * third,
      to.x - third,
      to.y - tangents[i + 1] * third,
      to.x,
      to.y,
    )
  }
  return path
}

/** Slopes at each point that keep a curve monotone between points (Fritsch–Carlson). */
internal fun monotoneTangents(xs: List<Float>, ys: List<Float>): FloatArray {
  val n = xs.size
  val tangents = FloatArray(n)
  if (n < 2) return tangents
  val slopes = FloatArray(n - 1) { (ys[it + 1] - ys[it]) / (xs[it + 1] - xs[it]) }
  tangents[0] = slopes[0]
  tangents[n - 1] = slopes[n - 2]
  for (i in 1 until n - 1) {
    tangents[i] = if (slopes[i - 1] * slopes[i] <= 0) 0f else (slopes[i - 1] + slopes[i]) / 2
  }
  for (i in 0 until n - 1) {
    if (slopes[i] == 0f) {
      tangents[i] = 0f
      tangents[i + 1] = 0f
      continue
    }
    val a = tangents[i] / slopes[i]
    val b = tangents[i + 1] / slopes[i]
    val length = hypot(a, b)
    if (length > 3) {
      tangents[i] = 3 * a / length * slopes[i]
      tangents[i + 1] = 3 * b / length * slopes[i]
    }
  }
  return tangents
}

/** The goal as a bar, for cards: the ring's colors on a line. */
@Composable
internal fun GoalBar(progress: Float, accent: AccentPalette, modifier: Modifier = Modifier) {
  val ambient = LocalAmbient.current
  val shown = animatedOnce(progress.coerceIn(0f, 1f), durationMillis = 900)
  Canvas(modifier) {
    val stroke = size.height / 2.6f
    val y = size.height / 2
    val from = stroke
    val to = size.width - stroke
    drawLine(Ink.track, Offset(from, y), Offset(to, y), stroke, StrokeCap.Round)
    val end = from + (to - from) * shown()
    if (shown() <= 0f) return@Canvas
    if (ambient) {
      drawLine(Ink.secondary, Offset(from, y), Offset(end, y), stroke / 2, StrokeCap.Round)
      return@Canvas
    }
    drawLine(
      Brush.horizontalGradient(listOf(Color(accent.deep), Color(accent.glow)), from, end),
      Offset(from, y),
      Offset(end, y),
      stroke,
      StrokeCap.Round,
    )
    glowingTip(Offset(end, y), Color(accent.glow), Color(accent.ink), stroke)
  }
}

/** The wall's gesture behind a screen: near-black, the accent glowing from the top. */
internal fun Modifier.instrumentBackground(accent: AccentPalette, ambient: Boolean) = drawBehind {
  drawRect(Color.Black)
  if (ambient) return@drawBehind
  drawRect(
    Brush.radialGradient(
      listOf(Color(accent.glow).copy(alpha = 0.2f), Color.Transparent),
      center = Offset(size.width / 2, -size.height * 0.12f),
      radius = size.height * 0.8f,
    )
  )
}

/**
 * A very faint grid of dots behind a hero, for the instrument feel: densest in the middle, gone
 * towards the bezel. Nothing while dozing.
 */
internal fun Modifier.dotGrid(ambient: Boolean) = drawWithCache {
  // Laid out once per size: the dots never move.
  val step = 10.dp.toPx()
  val center = Offset(size.width / 2, size.height / 2)
  val radius = size.minDimension / 2
  // Three rings of fading dots: cheaper than a mask, and as soft at this size.
  val bands = listOf(0.55f to 0.05f, 0.8f to 0.032f, 0.95f to 0.016f)
  val points = bands.map { mutableListOf<Offset>() }
  var y = center.y - step * floor(center.y / step)
  while (y < size.height) {
    var x = center.x - step * floor(center.x / step)
    while (x < size.width) {
      val distance = hypot(x - center.x, y - center.y) / radius
      val band = bands.indexOfFirst { distance <= it.first }
      if (band >= 0) points[band] += Offset(x, y)
      x += step
    }
    y += step
  }
  val dot = 1.5.dp.toPx()
  onDrawBehind {
    if (ambient) return@onDrawBehind
    bands.forEachIndexed { index, (_, alpha) ->
      drawPoints(
        points[index],
        PointMode.Points,
        Ink.primary.copy(alpha = alpha),
        strokeWidth = dot,
        cap = StrokeCap.Round,
      )
    }
  }
}

/**
 * A value that animates from [from] to its target the first time, then follows it; it jumps there
 * when nothing may move. Read it while drawing, so that only the drawing follows the animation.
 */
@Composable
private fun animatedOnce(target: Float, durationMillis: Int, from: Float = 0f): () -> Float {
  val animate = motionAllowed()
  val value = remember { Animatable(if (animate) from else target) }
  LaunchedEffect(target, animate) {
    if (animate) value.animateTo(target, tween(durationMillis, easing = FastOutSlowInEasing))
    else value.snapTo(target)
  }
  return { value.value }
}

package com.saasmonitor.wear.tile

import android.content.Context
import androidx.wear.protolayout.ColorBuilders.SweepGradient
import androidx.wear.protolayout.DeviceParametersBuilders.DeviceParameters
import androidx.wear.protolayout.DimensionBuilders
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.DimensionBuilders.wrap
import androidx.wear.protolayout.LayoutElementBuilders.ARC_ANCHOR_CENTER
import androidx.wear.protolayout.LayoutElementBuilders.ARC_ANCHOR_START
import androidx.wear.protolayout.LayoutElementBuilders.Arc
import androidx.wear.protolayout.LayoutElementBuilders.ArcLine
import androidx.wear.protolayout.LayoutElementBuilders.FONT_WEIGHT_BOLD
import androidx.wear.protolayout.LayoutElementBuilders.FONT_WEIGHT_MEDIUM
import androidx.wear.protolayout.LayoutElementBuilders.FontSetting
import androidx.wear.protolayout.LayoutElementBuilders.FontStyle
import androidx.wear.protolayout.LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER
import androidx.wear.protolayout.LayoutElementBuilders.LayoutElement
import androidx.wear.protolayout.LayoutElementBuilders.STROKE_CAP_ROUND
import androidx.wear.protolayout.LayoutElementBuilders.SpanText
import androidx.wear.protolayout.LayoutElementBuilders.Spannable
import androidx.wear.protolayout.LayoutElementBuilders.VERTICAL_ALIGN_CENTER
import androidx.wear.protolayout.ModifiersBuilders.Clickable
import androidx.wear.protolayout.layout.basicText
import androidx.wear.protolayout.layout.box
import androidx.wear.protolayout.layout.column
import androidx.wear.protolayout.layout.row
import androidx.wear.protolayout.layout.spacer
import androidx.wear.protolayout.material3.ColorScheme
import androidx.wear.protolayout.material3.MaterialScope
import androidx.wear.protolayout.material3.Typography
import androidx.wear.protolayout.material3.materialScope
import androidx.wear.protolayout.material3.primaryLayout
import androidx.wear.protolayout.material3.text
import androidx.wear.protolayout.modifiers.LayoutModifier
import androidx.wear.protolayout.modifiers.background
import androidx.wear.protolayout.modifiers.clip
import androidx.wear.protolayout.modifiers.padding
import androidx.wear.protolayout.types.LayoutColor
import androidx.wear.protolayout.types.argb
import androidx.wear.protolayout.types.degrees
import androidx.wear.protolayout.types.dp
import androidx.wear.protolayout.types.layoutString
import androidx.wear.protolayout.types.sp
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.MoneyText
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.Theme

/** What the tile shows: a screen's numbers, or a sentence when it has none. */
sealed interface TileContent {
  data class Ready(val name: String, val presentation: ScreenPresentation) : TileContent

  data class Message(val name: String?, val text: String) : TileContent
}

/**
 * A tile has no clock to make room for: the ring is a gauge open at the bottom, where the goal line
 * says what it measures.
 */
private const val RING_GAP = 84f
private const val RING_THICKNESS = 6f
/** From the bezel to the ring. */
private const val RING_INSET = 3f

/**
 * The MRR tile, the app's instrument as a glance: the goal as a ring along the bezel, the screen's
 * name, its MRR (or ARR) in large, its growth, and how far the goal is. Colors follow the watch's
 * dynamic theme when the user turned it on, else the accent.
 */
fun mrrTileLayout(
  context: Context,
  device: DeviceParameters,
  content: TileContent,
  onClick: Clickable,
): LayoutElement {
  val accent =
    (content as? TileContent.Ready)?.presentation?.snapshot?.settings?.accent ?: "emerald"
  return materialScope(
    context,
    device,
    allowDynamicTheme = true,
    defaultColorScheme = accentScheme(accent),
  ) {
    when (content) {
      is TileContent.Ready -> ready(content, onClick)
      is TileContent.Message ->
        primaryLayout(
          titleSlot = if (content.name != null) ({ text(content.name.layoutString) }) else null,
          mainSlot = {
            text(content.text.layoutString, typography = Typography.BODY_MEDIUM, maxLines = 3)
          },
          onClick = onClick,
        )
    }
  }
}

private fun MaterialScope.ready(content: TileContent.Ready, onClick: Clickable): LayoutElement {
  val presentation = content.presentation
  val layout =
    primaryLayout(
      titleSlot = {
        text(
          content.name.layoutString,
          typography = Typography.LABEL_MEDIUM,
          color = colorScheme.onSurfaceVariant,
        )
      },
      mainSlot = {
        column(
          label(presentation.metricLabel),
          hero(presentation.compactValueMoney),
          spacer(height = 2f.dp),
          deltaChip(presentation),
          width = expand(),
          horizontalAlignment = HORIZONTAL_ALIGN_CENTER,
        )
      },
      bottomSlot = { goalLine(presentation) },
      onClick = onClick,
    )
  return box(
    goalRing(presentation.goal.progress),
    layout,
    width = expand(),
    height = expand(),
    horizontalAlignment = HORIZONTAL_ALIGN_CENTER,
    verticalAlignment = VERTICAL_ALIGN_CENTER,
  )
}

/**
 * The goal along the bezel: a faint track, then the progress from the accent's deep shade to its
 * glow, with round caps and a glowing tip.
 */
private fun MaterialScope.goalRing(progress: Float): LayoutElement {
  val total = 360f - RING_GAP
  // Degrees clockwise from 12 o'clock: from the bottom left, round the top, to the bottom right.
  val start = 180f + RING_GAP / 2
  val sweep = total * progress.coerceIn(0f, 1f)
  val track =
    ArcLine.Builder()
      .setLength(total.degrees)
      .setThickness(RING_THICKNESS.dp)
      .setColor(withAlpha(colorScheme.onSurface, 0.12f).prop)
      .setStrokeCap(STROKE_CAP_ROUND)
      .build()
  val arcs = mutableListOf<LayoutElement>(arc(start, track))
  if (sweep > 0.5f) {
    val glow = colorScheme.primary
    val fill =
      ArcLine.Builder()
        .setLength(sweep.degrees)
        .setThickness(RING_THICKNESS.dp)
        // Renderers without gradients draw the plain accent.
        .setColor(glow.prop)
        // On an arc line, the gradient's angles count from the line's own start.
        .setBrush(
          SweepGradient.Builder(colorScheme.primaryDim.prop, glow.prop)
            .setStartAngle(0f.degrees)
            .setEndAngle(sweep.degrees)
            .build()
        )
        .setStrokeCap(STROKE_CAP_ROUND)
        .build()
    arcs += arc(start, fill)
  }
  val ring =
    box(
      *arcs.toTypedArray(),
      width = expand(),
      height = expand(),
      modifier = LayoutModifier.padding(RING_INSET),
    )
  if (sweep <= 0.5f) return ring
  // The glowing tip, drawn rather than left to cap shadows, which not every renderer draws: a soft
  // halo and a bright point, both centered on the ring's line.
  val tip = start + sweep
  return box(
    ring,
    tipDot(tip, thickness = RING_THICKNESS * 2.8f, withAlpha(colorScheme.primary, 0.12f)),
    tipDot(tip, thickness = RING_THICKNESS * 1.9f, withAlpha(colorScheme.primary, 0.22f)),
    tipDot(tip, thickness = RING_THICKNESS * 0.45f, colorScheme.onPrimaryContainer),
    width = expand(),
    height = expand(),
  )
}

/** A dot of [thickness] at [angle], centered on the ring's line. */
private fun tipDot(angle: Float, thickness: Float, color: LayoutColor): LayoutElement {
  val dot =
    ArcLine.Builder()
      .setLength(0.5f.degrees)
      .setThickness(thickness.dp)
      .setColor(color.prop)
      .setStrokeCap(STROKE_CAP_ROUND)
      .build()
  return box(
    Arc.Builder()
      .setAnchorAngle(angle.degrees)
      .setAnchorType(ARC_ANCHOR_CENTER)
      .addContent(dot)
      .build(),
    width = expand(),
    height = expand(),
    modifier =
      LayoutModifier.padding(
        (RING_INSET + (RING_THICKNESS - thickness) / 2).coerceAtLeast(0f)
      ),
  )
}

private fun arc(start: Float, line: ArcLine): LayoutElement =
  Arc.Builder()
    .setAnchorAngle(start.degrees)
    .setAnchorType(ARC_ANCHOR_START)
    .addContent(line)
    .build()

/** "MRR": small, uppercase, spaced, like the app's telemetry labels. */
private fun MaterialScope.label(text: String): LayoutElement =
  basicText(
    text.layoutString,
    fontStyle =
      FontStyle.Builder()
        .setSize(11f.sp)
        .setLetterSpacing(DimensionBuilders.EmProp.Builder().setValue(0.16f).build())
        .setColor(colorScheme.onSurfaceVariant.prop)
        .setPreferredFontFamilies(FontStyle.ROBOTO_FLEX_FONT)
        .setSettings(FontSetting.weight(500))
        .build(),
  )

/** The amount in large, tabular digits, its currency symbol smaller and dimmer. */
private fun MaterialScope.hero(money: MoneyText): LayoutElement {
  val symbol = money.symbol
  val parts =
    if (symbol == null) listOf(money.text to false)
    else
      listOf(
          money.text.substring(0, symbol.first) to false,
          money.text.substring(symbol.first, symbol.last + 1) to true,
          money.text.substring(symbol.last + 1) to false,
        )
        .filter { it.first.isNotEmpty() }
  // Tiles can't shrink text to fit: long amounts ("12,5 k $US", "1,2 Mio. €") step down instead.
  val size =
    when {
      money.text.length <= 6 -> 42f
      money.text.length <= 8 -> 36f
      else -> 30f
    }
  val spannable = Spannable.Builder().setMaxLines(1)
  for ((part, isSymbol) in parts) {
    spannable.addSpan(
      SpanText.Builder()
        .setText(part)
        .setFontStyle(
          FontStyle.Builder()
            .setSize((if (isSymbol) size * 0.57f else size).sp)
            .setColor(
              (if (isSymbol) colorScheme.onSurfaceVariant else colorScheme.onSurface).prop
            )
            .setPreferredFontFamilies(FontStyle.ROBOTO_FLEX_FONT)
            .setWeight(if (isSymbol) FONT_WEIGHT_MEDIUM else FONT_WEIGHT_BOLD)
            .setSettings(FontSetting.weight(if (isSymbol) 500 else 650), FontSetting.tabularNum())
            .build()
        )
        .build()
    )
  }
  return spannable.build()
}

/** "▲ +1.2 %  30d" on the accent's wash; a loss in neutral ink, never alarm red. */
private fun MaterialScope.deltaChip(presentation: ScreenPresentation): LayoutElement {
  val growing = presentation.growing && !presentation.flat
  val ink = if (growing) colorScheme.primary else colorScheme.onSurfaceVariant
  val arrow = if (presentation.flat) "" else if (growing) "▲ " else "▼ "
  val change = presentation.growthPercentText ?: presentation.growthAmountText
  return row(
    text("$arrow$change".layoutString, typography = Typography.LABEL_MEDIUM, color = ink),
    spacer(width = 5f.dp),
    text(
      presentation.growthPeriodText.layoutString,
      typography = Typography.LABEL_SMALL,
      color = colorScheme.onSurfaceVariant,
    ),
    width = wrap(),
    modifier =
      LayoutModifier.background(
          if (growing) withAlpha(colorScheme.primary, 0.16f)
          else withAlpha(colorScheme.onSurface, 0.08f)
        )
        .clip(100f)
        .padding(start = 9f, top = 3f, end = 9f, bottom = 3f, rtlAware = true),
  )
}

/** "57 % · $10K MRR": what the ring measures. */
private fun MaterialScope.goalLine(presentation: ScreenPresentation): LayoutElement =
  row(
    text(
      presentation.goalPercentText.layoutString,
      typography = Typography.LABEL_SMALL,
      color = colorScheme.primary,
    ),
    text(
      " · ${presentation.goalTargetText}".layoutString,
      typography = Typography.LABEL_SMALL,
      color = colorScheme.onSurfaceVariant,
    ),
  )

private fun withAlpha(color: LayoutColor, alpha: Float): LayoutColor {
  val argb = color.staticArgb
  return ((argb and 0x00FFFFFF) or ((alpha * 255).toInt() shl 24)).argb
}

/** The screen's accent as the tile's primary color, on the watch's black. */
private fun accentScheme(accent: String): ColorScheme {
  val palette = Accents.palette(accent, Theme.DARK)
  return ColorScheme(
    primary = palette.glow.argb,
    primaryDim = palette.deep.argb,
    onPrimary = 0xFF08090B.toInt().argb,
    primaryContainer = palette.deep.argb,
    onPrimaryContainer = palette.ink.argb,
    onSurface = 0xFFF4F5F7.toInt().argb,
    onSurfaceVariant = 0xFFA8ADB5.toInt().argb,
  )
}

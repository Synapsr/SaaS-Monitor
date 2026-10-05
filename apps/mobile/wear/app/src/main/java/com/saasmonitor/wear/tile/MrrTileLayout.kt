package com.saasmonitor.wear.tile

import android.content.Context
import androidx.wear.protolayout.DeviceParametersBuilders.DeviceParameters
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER
import androidx.wear.protolayout.LayoutElementBuilders.LayoutElement
import androidx.wear.protolayout.LayoutElementBuilders.VERTICAL_ALIGN_CENTER
import androidx.wear.protolayout.ModifiersBuilders.Clickable
import androidx.wear.protolayout.layout.box
import androidx.wear.protolayout.layout.column
import androidx.wear.protolayout.material3.ColorScheme
import androidx.wear.protolayout.material3.MaterialScope
import androidx.wear.protolayout.material3.Typography
import androidx.wear.protolayout.material3.circularProgressIndicator
import androidx.wear.protolayout.material3.materialScope
import androidx.wear.protolayout.material3.primaryLayout
import androidx.wear.protolayout.material3.text
import androidx.wear.protolayout.types.argb
import androidx.wear.protolayout.types.layoutString
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.Theme

/** What the tile shows: a screen's numbers, or a sentence when it has none. */
sealed interface TileContent {
  data class Ready(val name: String, val presentation: ScreenPresentation) : TileContent

  data class Message(val name: String?, val text: String) : TileContent
}

/**
 * The MRR tile: the screen's name, its MRR (or ARR) and growth inside its goal ring, and the goal
 * below. Colors follow the watch's dynamic theme when the user turned it on, else the accent.
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
  return primaryLayout(
    titleSlot = { text(content.name.layoutString) },
    mainSlot = {
      box(
        circularProgressIndicator(staticProgress = presentation.goal.progress),
        column(
          text(
            presentation.metricLabel.layoutString,
            typography = Typography.LABEL_SMALL,
            color = colorScheme.onSurfaceVariant,
          ),
          text(presentation.compactValueText.layoutString, typography = Typography.NUMERAL_SMALL),
          text(
            (presentation.growthPercentText ?: presentation.growthAmountText).layoutString,
            typography = Typography.LABEL_MEDIUM,
            color = if (presentation.growing) colorScheme.primary else colorScheme.onSurfaceVariant,
          ),
          horizontalAlignment = HORIZONTAL_ALIGN_CENTER,
        ),
        width = expand(),
        height = expand(),
        horizontalAlignment = HORIZONTAL_ALIGN_CENTER,
        verticalAlignment = VERTICAL_ALIGN_CENTER,
      )
    },
    labelForBottomSlot = { text(presentation.goalTargetText.layoutString) },
    bottomSlot = { text(presentation.goalPercentText.layoutString) },
    onClick = onClick,
  )
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
  )
}

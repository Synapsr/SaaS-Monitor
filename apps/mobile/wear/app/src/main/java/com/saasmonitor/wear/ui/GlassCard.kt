package com.saasmonitor.wear.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.paint
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.painter.BrushPainter
import androidx.compose.ui.graphics.painter.ColorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material3.Card
import androidx.wear.compose.material3.CardDefaults
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.SurfaceTransformation

/** A card's surface: lifted from the black, lit from above, edged with a hairline of ink. */
private val glass = Brush.verticalGradient(listOf(Color(0xFF17191D), Color(0xFF0F1013)))
private val hairline = BorderStroke(Dp.Hairline, Ink.hairline)
private val padding = PaddingValues(horizontal = 14.dp, vertical = 11.dp)

/**
 * The glass surface numbers sit on in lists. It morphs like Material's cards as it scrolls by the
 * edges of the round screen ([transformation]), and is a [Card] when it can be tapped.
 */
@Composable
internal fun GlassCard(
  modifier: Modifier = Modifier,
  transformation: SurfaceTransformation? = null,
  onClick: (() -> Unit)? = null,
  contentPadding: PaddingValues = padding,
  content: @Composable ColumnScope.() -> Unit,
) {
  val ambient = LocalAmbient.current
  // Dozing, the card is only its outline: lit pixels stay few.
  val painter =
    remember(ambient) { if (ambient) ColorPainter(Color.Black) else BrushPainter(glass) }
  if (onClick != null) {
    Card(
      onClick = onClick,
      containerPainter = painter,
      modifier = modifier,
      colors = CardDefaults.cardColors(contentColor = Ink.primary),
      border = hairline,
      contentPadding = contentPadding,
      transformation = transformation,
      content = content,
    )
    return
  }
  val shape = MaterialTheme.shapes.large
  val container =
    remember(transformation, painter, shape) {
      transformation?.createContainerPainter(painter, shape, hairline)
    }
  Box(
    modifier
      .then(
        if (transformation != null)
          Modifier.graphicsLayer { with(transformation) { applyContainerTransformation() } }
        else Modifier
      )
      .then(
        if (container != null) Modifier.paint(container, contentScale = ContentScale.Crop)
        else
          Modifier.clip(shape)
            .paint(painter, contentScale = ContentScale.Crop)
            .border(hairline, shape)
      )
  ) {
    Column(
      Modifier.then(
          if (transformation != null)
            Modifier.graphicsLayer { with(transformation) { applyContentTransformation() } }
          else Modifier
        )
        .padding(contentPadding),
      content = content,
    )
  }
}

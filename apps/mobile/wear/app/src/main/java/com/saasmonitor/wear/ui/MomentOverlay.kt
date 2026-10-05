package com.saasmonitor.wear.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.Text
import androidx.wear.tooling.preview.devices.WearDevices
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.moments.Moment
import com.saasmonitor.core.moments.MomentCard
import com.saasmonitor.core.state.Theme

/**
 * What just happened, over the whole watch face of the app for a few seconds, like a wall display's
 * moment card: the title, the amount in large, who and what. Tapping it moves on.
 */
@Composable
fun MomentOverlay(moment: WatchMoment?, onDismiss: (String) -> Unit) {
  val context = LocalContext.current
  LaunchedEffect(moment?.id) { moment?.let { MomentHaptics.play(context, it.card.celebration) } }
  // The black stays while moments follow each other: only their content fades through.
  AnimatedVisibility(visible = moment != null, enter = fadeIn(), exit = fadeOut()) {
    Box(Modifier.fillMaxSize().background(Color.Black)) {
      AnimatedContent(
        targetState = moment,
        contentKey = { it?.id },
        transitionSpec = {
          (fadeIn(tween(durationMillis = 260, delayMillis = 120)) +
            scaleIn(
              tween(durationMillis = 260, delayMillis = 120),
              initialScale = 0.92f,
            )) togetherWith fadeOut(tween(durationMillis = 120))
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
  val palette = Accents.palette(moment.accent, Theme.DARK)
  val ink = if (card.celebration) Color(palette.ink) else MaterialTheme.colorScheme.onSurfaceVariant
  // Losses are said plainly: no glow.
  val glow =
    if (card.celebration)
      Brush.radialGradient(listOf(Color(palette.glow).copy(alpha = 0.32f), Color.Transparent))
    else Brush.radialGradient(listOf(Color.Transparent, Color.Transparent))
  Box(
    modifier =
      Modifier.fillMaxSize().background(Color.Black).background(glow).clickable(
        interactionSource = remember { MutableInteractionSource() },
        indication = null,
      ) {
        onDismiss(moment.id)
      },
    contentAlignment = Alignment.Center,
  ) {
    Column(
      modifier = Modifier.fillMaxWidth().padding(horizontal = 28.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center,
    ) {
      Text(
        listOfNotNull(moment.screenName, card.account).joinToString(" · "),
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
      Spacer(Modifier.height(6.dp))
      // The icon above the title: a title of two lines stays centered on a round screen.
      Icon(
        painter = painterResource(card.icon.drawable),
        contentDescription = null,
        tint = ink,
        modifier = Modifier.size(20.dp),
      )
      Spacer(Modifier.height(2.dp))
      Text(
        card.eyebrow,
        style = MaterialTheme.typography.titleSmall,
        color = ink,
        textAlign = TextAlign.Center,
        maxLines = 2,
      )
      Spacer(Modifier.height(4.dp))
      Headline(card)
      if (card.details.isNotEmpty()) {
        Text(
          card.details,
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          textAlign = TextAlign.Center,
          maxLines = 3,
          overflow = TextOverflow.Ellipsis,
        )
      }
      card.footnote?.let { footnote ->
        Spacer(Modifier.height(8.dp))
        Text(
          footnote,
          style = MaterialTheme.typography.labelSmall,
          color = ink,
          maxLines = 1,
          modifier =
            Modifier.background(
                if (card.celebration) Color(palette.glow).copy(alpha = 0.16f)
                else Color.White.copy(alpha = 0.08f),
                CircleShape,
              )
              .padding(horizontal = 10.dp, vertical = 4.dp),
        )
      }
    }
  }
}

/** The amount in large, shrunk to fit one line; a name on two lines at most. */
@Composable
private fun Headline(card: MomentCard) {
  val color = if (card.celebration) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
  if (card.headlineIsName) {
    Text(
      card.headline,
      style = MaterialTheme.typography.titleLarge,
      color = color,
      textAlign = TextAlign.Center,
      maxLines = 2,
      overflow = TextOverflow.Ellipsis,
    )
    return
  }
  Row(verticalAlignment = Alignment.Bottom) {
    BasicText(
      card.headline,
      style = MaterialTheme.typography.numeralMedium.copy(color = color),
      maxLines = 1,
      autoSize = TextAutoSize.StepBased(minFontSize = 20.sp, maxFontSize = 44.sp),
      modifier = Modifier.weight(1f, fill = false),
    )
    card.metric?.let {
      Spacer(Modifier.width(4.dp))
      Text(
        it,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(bottom = 6.dp),
      )
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
      MomentCard.of(Moment.Movement(state.feed[4]), state),
      false,
    ),
    onDismiss = {},
  )
}

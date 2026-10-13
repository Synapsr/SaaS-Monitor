package com.saasmonitor.wear.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.SurfaceTransformation
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.lazy.rememberTransformationSpec
import androidx.wear.compose.material3.lazy.transformedHeight
import androidx.wear.tooling.preview.devices.WearDevices
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.core.state.Theme
import com.saasmonitor.wear.R

/** The screens the phone shared, each a card with its MRR, its growth, its curve, live or not. */
@Composable
fun ScreenListScreen(items: List<ScreenItem>?, onOpen: (String) -> Unit) {
  val state = rememberTransformingLazyColumnState()
  val spec = rememberTransformationSpec()
  val now = rememberNow()
  val ambient = LocalAmbient.current
  // The first screen lights the list, as a wall lights the room.
  val firstAccent = items?.firstOrNull()?.cached?.snapshot?.settings?.accent
  val accent = Accents.palette(firstAccent ?: "emerald", Theme.DARK)
  val background = Modifier.instrumentBackground(accent, ambient)
  ScreenScaffold(scrollState = state, modifier = background) { padding ->
    TransformingLazyColumn(state = state, contentPadding = padding) {
      item {
        ListHeader(
          modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
          transformation = SurfaceTransformation(spec),
        ) {
          Icon(
            painter = painterResource(R.drawable.sm_pulse),
            contentDescription = null,
            tint = if (ambient) Ink.secondary else Color(accent.glow),
            modifier = Modifier.size(width = 16.dp, height = 12.dp),
          )
          Spacer(Modifier.width(6.dp))
          Text(stringResource(R.string.app_name), color = Ink.secondary)
        }
      }
      when {
        items == null -> Unit
        items.isEmpty() ->
          item {
            Column(
              Modifier.fillMaxWidth().padding(horizontal = 8.dp).transformedHeight(this, spec),
              horizontalAlignment = Alignment.CenterHorizontally,
            ) {
              Text(
                stringResource(R.string.no_screens),
                style = MaterialTheme.typography.titleMedium,
                color = Ink.primary,
                textAlign = TextAlign.Center,
              )
              Spacer(Modifier.height(4.dp))
              Text(
                stringResource(R.string.no_screens_details),
                style = MaterialTheme.typography.bodySmall,
                color = Ink.secondary,
                textAlign = TextAlign.Center,
              )
            }
          }
        else ->
          items(items, key = { it.screen.key }) { item ->
            ScreenCard(
              item = item,
              now = now,
              onClick = { onOpen(item.screen.key) },
              modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
              transformation = SurfaceTransformation(spec),
            )
          }
      }
    }
  }
}

/** A screen at a glance: live or not, its name, its compact MRR and growth, and its curve. */
@Composable
private fun ScreenCard(
  item: ScreenItem,
  now: Long,
  onClick: () -> Unit,
  modifier: Modifier,
  transformation: SurfaceTransformation,
) {
  val message = screenMessage(item.cached)
  val snapshot = item.cached.snapshot?.takeIf { message == null }
  val presentation = remember(snapshot, now) { snapshot?.let { ScreenPresentation(it, now) } }
  val accent = Accents.palette(snapshot?.settings?.accent ?: "emerald", Theme.DARK)
  val live = presentation?.let { freshness(item.cached, it, now).live } ?: false
  GlassCard(
    modifier,
    transformation,
    onClick = onClick,
    contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 9.dp, bottom = 10.dp),
  ) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      LiveDot(live, accent)
      Spacer(Modifier.width(4.dp))
      Text(
        item.screen.name,
        style = MaterialTheme.typography.labelMedium,
        color = Ink.secondary,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
    }
    if (presentation == null) {
      Text(
        message ?: stringResource(R.string.loading),
        style = MaterialTheme.typography.bodySmall,
        color = Ink.tertiary,
        maxLines = 2,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.padding(start = 16.dp, top = 2.dp),
      )
      return@GlassCard
    }
    Row(verticalAlignment = Alignment.CenterVertically) {
      Column(Modifier.weight(1f)) {
        HeroAmount(
          presentation.compactValueMoney,
          presentation.value,
          style =
            MaterialTheme.typography.numeralExtraSmall.copy(
              fontSize = 26.sp,
              fontWeight = FontWeight.SemiBold,
            ),
          minSize = 16.sp,
        )
        DeltaChip(presentation, accent, Modifier.padding(top = 2.dp), showPeriod = false)
      }
      Spacer(Modifier.width(8.dp))
      Sparkline(
        presentation.sparkline,
        accent,
        Modifier.size(width = 60.dp, height = 40.dp),
        lineWidth = 1.5.dp,
        curveHeight = 0.72f,
        fillAlpha = 0.24f,
      )
    }
  }
}

@Preview(device = WearDevices.LARGE_ROUND, showSystemUi = true)
@Composable
private fun ScreenListPreview() {
  val acme = SharedScreen("a1", "Acme Analytics", "https://saas-monitor.com", "t", null)
  val side = SharedScreen("b2", "Side project", "https://monitor.example.com", "u", null)
  val now = System.currentTimeMillis()
  WearTheme {
    ScreenListScreen(
      items =
        listOf(
          ScreenItem(acme, CachedScreen(SampleSnapshots.acme(), now, null), featured = true),
          ScreenItem(
            side,
            CachedScreen(SampleSnapshots.acme(accent = "violet"), 0, null),
            featured = false,
          ),
        ),
      onOpen = {},
    )
  }
}

@Preview(device = WearDevices.SMALL_ROUND, showSystemUi = true)
@Composable
private fun NoScreensPreview() = WearTheme { ScreenListScreen(items = emptyList(), onOpen = {}) }

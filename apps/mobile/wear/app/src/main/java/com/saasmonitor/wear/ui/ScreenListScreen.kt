package com.saasmonitor.wear.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.Button
import androidx.wear.compose.material3.ButtonDefaults
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
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.core.state.Theme
import com.saasmonitor.wear.R

/** The screens the phone shared, each with its MRR and growth when known. */
@Composable
fun ScreenListScreen(items: List<ScreenItem>?, onOpen: (String) -> Unit) {
  val state = rememberTransformingLazyColumnState()
  val spec = rememberTransformationSpec()
  ScreenScaffold(scrollState = state) { padding ->
    TransformingLazyColumn(state = state, contentPadding = padding) {
      item {
        ListHeader(
          modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
          transformation = SurfaceTransformation(spec),
        ) {
          Text(stringResource(R.string.app_name))
        }
      }
      when {
        items == null -> Unit
        items.isEmpty() ->
          item {
            Text(
              text = stringResource(R.string.no_screens_details),
              style = MaterialTheme.typography.bodyMedium,
              textAlign = TextAlign.Center,
              color = MaterialTheme.colorScheme.onSurfaceVariant,
              modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
            )
          }
        else ->
          items(items, key = { it.screen.key }) { item ->
            ScreenButton(
              item = item,
              onClick = { onOpen(item.screen.key) },
              modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
              transformation = SurfaceTransformation(spec),
            )
          }
      }
    }
  }
}

@Composable
private fun ScreenButton(
  item: ScreenItem,
  onClick: () -> Unit,
  modifier: Modifier,
  transformation: SurfaceTransformation,
) {
  val snapshot = item.cached.snapshot?.takeIf { it.status == ScreenSnapshot.Status.READY }
  val presentation = snapshot?.let { ScreenPresentation(it) }
  val accent = snapshot?.settings?.accent ?: "emerald"
  Button(
    onClick = onClick,
    modifier = modifier,
    transformation = transformation,
    colors = ButtonDefaults.filledTonalButtonColors(),
    icon = {
      Icon(
        painter = painterResource(R.drawable.sm_pulse),
        contentDescription = null,
        tint = Color(Accents.palette(accent, Theme.DARK).glow),
        modifier = Modifier.size(ButtonDefaults.IconSize),
      )
    },
    secondaryLabel =
      presentation?.let {
        {
          Text(
            text =
              "${it.metricLabel} ${it.compactValueText} · ${it.growthPercentText ?: it.growthAmountText}",
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
          )
        }
      },
    label = { Text(item.screen.name, maxLines = 1, overflow = TextOverflow.Ellipsis) },
  )
}

@Preview(device = WearDevices.LARGE_ROUND, showSystemUi = true)
@Composable
private fun ScreenListPreview() {
  val acme = SharedScreen("a1", "Acme Analytics", "https://saas-monitor.com", "t", null)
  val side = SharedScreen("b2", "Side project", "https://monitor.example.com", "u", null)
  WearTheme {
    ScreenListScreen(
      items =
        listOf(
          ScreenItem(acme, CachedScreen(SampleSnapshots.acme(), 0, null), featured = true),
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

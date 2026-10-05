package com.saasmonitor.wear.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.TransformingLazyColumnScope
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.EdgeButton
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.LinearProgressIndicator
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.SurfaceTransformation
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.TitleCard
import androidx.wear.compose.material3.lazy.TransformationSpec
import androidx.wear.compose.material3.lazy.rememberTransformationSpec
import androidx.wear.compose.material3.lazy.transformedHeight
import androidx.wear.tooling.preview.devices.WearDevices
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.display.FeedIcon
import com.saasmonitor.core.display.FeedLine
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.core.state.ScreenProblem
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.wear.R
import kotlinx.coroutines.delay

/** How often an open screen fetches its state: a wall polls every 10 s, a wrist can wait. */
private const val POLL_MILLIS = 60_000L

/** One screen: its MRR and growth, its goal, today's revenue and the latest activity. */
@Composable
fun ScreenDetailScreen(item: ScreenItem, onRefresh: () -> Unit, onFeature: () -> Unit) {
  LaunchedEffect(item.screen.key) {
    while (true) {
      onRefresh()
      delay(POLL_MILLIS)
    }
  }
  val snapshot = item.cached.snapshot
  val state = rememberTransformingLazyColumnState()
  val spec = rememberTransformationSpec()
  WearTheme(accent = snapshot?.settings?.accent ?: "emerald") {
    val list: @Composable (androidx.compose.foundation.layout.PaddingValues) -> Unit = { padding ->
      TransformingLazyColumn(state = state, contentPadding = padding) {
        item {
          ListHeader(
            modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
            transformation = SurfaceTransformation(spec),
          ) {
            Text(item.screen.name, maxLines = 1, overflow = TextOverflow.Ellipsis)
          }
        }
        val message = message(item.cached)
        if (message != null || snapshot == null) {
          item {
            Text(
              text = message ?: stringResource(R.string.loading),
              style = MaterialTheme.typography.bodyMedium,
              textAlign = TextAlign.Center,
              modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
            )
          }
        } else {
          screenNumbers(ScreenPresentation(snapshot), spec)
        }
      }
    }
    if (item.featured) {
      ScreenScaffold(scrollState = state) { padding -> list(padding) }
    } else {
      ScreenScaffold(
        scrollState = state,
        edgeButton = {
          EdgeButton(onClick = onFeature) { Text(stringResource(R.string.show_on_tile)) }
        },
      ) { padding ->
        list(padding)
      }
    }
  }
}

private fun TransformingLazyColumnScope.screenNumbers(
  presentation: ScreenPresentation,
  spec: TransformationSpec,
) {
  item { Hero(presentation, Modifier.fillMaxWidth().transformedHeight(this, spec)) }
  item { Goal(presentation, Modifier.fillMaxWidth().transformedHeight(this, spec)) }
  item {
    TitleCard(
      title = { Text(presentation.text.revenueToday) },
      modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
      transformation = SurfaceTransformation(spec),
    ) {
      Text(presentation.revenueTodayText, style = MaterialTheme.typography.numeralExtraSmall)
    }
  }
  if (presentation.feed.isNotEmpty()) {
    item {
      ListHeader(
        modifier = Modifier.fillMaxWidth().transformedHeight(this, spec),
        transformation = SurfaceTransformation(spec),
      ) {
        Text(presentation.text.feedTitle)
      }
    }
    items(presentation.feed, key = { it.id }) { line ->
      FeedCard(
        line,
        Modifier.fillMaxWidth().transformedHeight(this, spec),
        SurfaceTransformation(spec),
      )
    }
  }
}

/** "MRR", the amount, and its growth in the accent: the wall's hero, on a wrist. */
@Composable
private fun Hero(presentation: ScreenPresentation, modifier: Modifier) {
  Column(
    modifier = modifier.padding(vertical = 4.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Text(
      presentation.metricLabel,
      style = MaterialTheme.typography.labelMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Text(presentation.valueText, style = MaterialTheme.typography.numeralSmall, maxLines = 1)
    Text(
      presentation.growthText,
      style = MaterialTheme.typography.labelMedium,
      color =
        if (presentation.growing) MaterialTheme.colorScheme.primary
        else MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Text(
      presentation.text.inThirtyDays,
      style = MaterialTheme.typography.bodyExtraSmall,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
  }
}

@Composable
private fun Goal(presentation: ScreenPresentation, modifier: Modifier) {
  Column(modifier = modifier.padding(horizontal = 8.dp, vertical = 6.dp)) {
    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
      Text(
        "${presentation.goalTitle} ${presentation.goalTargetText}",
        style = MaterialTheme.typography.labelSmall,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.weight(1f),
      )
      Text(presentation.goalPercentText, style = MaterialTheme.typography.labelSmall)
    }
    Spacer(Modifier.height(6.dp))
    LinearProgressIndicator(progress = { presentation.goal.progress })
    Spacer(Modifier.height(4.dp))
    Text(
      listOfNotNull(presentation.goalRemainingText, presentation.goalEtaText).joinToString(" · "),
      style = MaterialTheme.typography.bodyExtraSmall,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
  }
}

@Composable
private fun FeedCard(line: FeedLine, modifier: Modifier, transformation: SurfaceTransformation) {
  TitleCard(
    title = {
      Icon(
        painter = painterResource(line.icon.drawable),
        contentDescription = line.kindLabel,
        tint =
          if (line.isGoodNews) MaterialTheme.colorScheme.primary
          else MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.size(18.dp),
      )
      Spacer(Modifier.width(6.dp))
      Text(
        listOfNotNull(line.headline, line.metricSuffix).joinToString(" "),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
    },
    time = { Text(line.time) },
    modifier = modifier,
    transformation = transformation,
  ) {
    if (line.details.isNotEmpty())
      Text(line.details, maxLines = 2, overflow = TextOverflow.Ellipsis)
  }
}

/** Why a screen shows no numbers, in its language; `null` when it has some. */
private fun message(cached: CachedScreen): String? {
  val snapshot = cached.snapshot
  val text = (snapshot?.settings?.language ?: Language.EN).text
  return when {
    cached.problem == ScreenProblem.LOCKED -> text.locked
    cached.problem == ScreenProblem.GONE -> text.gone
    snapshot?.status == ScreenSnapshot.Status.EMPTY -> text.empty
    snapshot?.status == ScreenSnapshot.Status.IMPORTING -> text.importing
    snapshot?.status == ScreenSnapshot.Status.ERROR -> text.failing
    else -> null
  }
}

/** The shared icons (`sm_kind_*`, `sm_churn_*`), as the web display picks them. */
private val FeedIcon.drawable: Int
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

@Preview(device = WearDevices.LARGE_ROUND, showSystemUi = true)
@Composable
private fun ScreenDetailPreview() {
  val screen = SharedScreen("a1", "Acme Analytics", "https://saas-monitor.com", "t", null)
  ScreenDetailScreen(
    item = ScreenItem(screen, CachedScreen(SampleSnapshots.acme(), 0, null), featured = false),
    onRefresh = {},
    onFeature = {},
  )
}

@Preview(device = WearDevices.SMALL_ROUND, showSystemUi = true)
@Composable
private fun ScreenDetailFrenchArrPreview() {
  val screen = SharedScreen("a1", "Acme", "https://saas-monitor.com", "t", null)
  val snapshot =
    SampleSnapshots.acme(
      accent = "amber",
      language = Language.FR,
      metric = com.saasmonitor.core.state.Metric.ARR,
    )
  ScreenDetailScreen(
    item = ScreenItem(screen, CachedScreen(snapshot, 0, null), featured = true),
    onRefresh = {},
    onFeature = {},
  )
}

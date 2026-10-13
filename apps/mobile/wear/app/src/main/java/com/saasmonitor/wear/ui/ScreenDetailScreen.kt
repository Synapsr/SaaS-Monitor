package com.saasmonitor.wear.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.CurvedDirection
import androidx.wear.compose.foundation.CurvedLayout
import androidx.wear.compose.foundation.CurvedModifier
import androidx.wear.compose.foundation.CurvedTextStyle
import androidx.wear.compose.foundation.basicCurvedText
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.TransformingLazyColumnScope
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.foundation.sizeIn
import androidx.wear.compose.material3.EdgeButton
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.SurfaceTransformation
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.TimeText
import androidx.wear.compose.material3.lazy.TransformationSpec
import androidx.wear.compose.material3.lazy.rememberTransformationSpec
import androidx.wear.compose.material3.lazy.transformedHeight
import androidx.wear.tooling.preview.devices.WearDevices
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.display.AccentPalette
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.FeedLine
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.core.state.Metric
import com.saasmonitor.core.state.Theme
import com.saasmonitor.wear.R
import java.util.Locale

/** The ring leaves the top of the bezel to the time. */
private const val RING_GAP = 46f
/** Cards keep the margins of Material lists on round screens. */
private val CARD_MARGIN = 10.dp
/** The name sits inside the ring, under the time. */
private val NAME_INSET = 21.dp

/**
 * One screen as an instrument: its goal as a ring along the bezel, its MRR in the middle, live,
 * with its growth and its curve; below, its goal, today's revenue and the latest activity.
 */
@Composable
fun ScreenDetailScreen(item: ScreenItem, onFeature: () -> Unit) {
  val snapshot = item.cached.snapshot
  val accent = Accents.palette(snapshot?.settings?.accent ?: "emerald", Theme.DARK)
  val now = rememberNow()
  val message = screenMessage(item.cached)
  val presentation =
    remember(snapshot, message, now) {
      snapshot?.takeIf { message == null }?.let { ScreenPresentation(it, now) }
    }
  val state = rememberTransformingLazyColumnState()
  val spec = rememberTransformationSpec()
  val ambient = LocalAmbient.current
  val content: @Composable BoxScope.(PaddingValues) -> Unit = { padding ->
    TransformingLazyColumn(
      state = state,
      // The first page is the whole round screen: it brings its own margins.
      contentPadding = PaddingValues(bottom = padding.calculateBottomPadding()),
      modifier = Modifier.fillMaxSize(),
    ) {
      if (presentation == null) {
        item {
          MessagePage(
            item.screen.name,
            (snapshot?.settings?.language ?: Language.EN).locale,
            message ?: stringResource(R.string.loading),
            Modifier.fillMaxWidth().height(screenHeight()),
          )
        }
      } else {
        item {
          HeroPage(
            item.screen.name,
            presentation,
            freshness(item.cached, presentation, now),
            accent,
            Modifier.fillMaxWidth().height(screenHeight()),
          )
        }
        screenNumbers(presentation, accent, spec, featured = item.featured)
      }
    }
  }
  WearTheme(accent = snapshot?.settings?.accent ?: "emerald") {
    val background = Modifier.instrumentBackground(accent, ambient)
    val timeText = @Composable { TimeText() }
    if (presentation != null && !item.featured) {
      ScreenScaffold(
        scrollState = state,
        modifier = background,
        timeText = timeText,
        edgeButton = {
          EdgeButton(onClick = onFeature) { Text(stringResource(R.string.show_on_tile)) }
        },
        content = content,
      )
    } else {
      ScreenScaffold(
        scrollState = state,
        modifier = background,
        timeText = timeText,
        content = content,
      )
    }
  }
}

@Composable private fun screenHeight(): Dp = LocalConfiguration.current.screenHeightDp.dp

/** The screen's name, curved along the top just inside the ring, under the time. */
@Composable
private fun CurvedName(name: String, locale: Locale, modifier: Modifier) {
  CurvedLayout(modifier, anchor = 270f) {
    basicCurvedText(
      name.uppercase(locale),
      style =
        CurvedTextStyle(telemetryStyle(9.sp).copy(color = Ink.secondary, letterSpacing = 0.12.em)),
      modifier = CurvedModifier.sizeIn(maxSweepDegrees = 84f),
      overflow = TextOverflow.Ellipsis,
    )
  }
}

/**
 * The hero, a page the size of the screen: the goal ring hugging the bezel, the telemetry line, the
 * amount, the growth, the curve along the bottom, and how far the goal is, curved under it.
 */
@Composable
private fun HeroPage(
  name: String,
  presentation: ScreenPresentation,
  freshness: Freshness,
  accent: AccentPalette,
  modifier: Modifier,
) {
  val locale = presentation.language.locale
  val ambient = LocalAmbient.current
  Box(modifier.dotGrid(ambient)) {
    GoalRing(presentation.goal.progress, accent, Modifier.fillMaxSize(), gapDegrees = RING_GAP)
    CurvedName(name, locale, Modifier.fillMaxSize().padding(NAME_INSET))
    // The curve fills the bottom of the dial, inside the ring.
    Box(Modifier.fillMaxSize().padding(13.dp).clip(CircleShape)) {
      Sparkline(
        presentation.sparkline,
        accent,
        Modifier.align(Alignment.BottomCenter)
          .fillMaxWidth()
          .fillMaxHeight(0.36f)
          .padding(bottom = 22.dp),
      )
    }
    Column(
      Modifier.align(Alignment.Center).offset(y = (-10).dp).padding(horizontal = 26.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
    ) {
      Row(verticalAlignment = Alignment.CenterVertically) {
        TelemetryLabel(presentation.metricLabel, locale, color = Ink.secondary)
        Spacer(Modifier.width(8.dp))
        LiveIndicator(freshness.live, freshness.label, accent, locale)
      }
      HeroAmount(
        presentation.valueMoney,
        presentation.value,
        style = MaterialTheme.typography.numeralMedium,
        modifier = Modifier.padding(top = 2.dp),
      )
      Spacer(Modifier.height(4.dp))
      DeltaChip(presentation, accent)
    }
    GoalReadout(presentation, accent, ambient, Modifier.fillMaxSize().padding(13.dp))
  }
}

/** "57 % · $10K MRR", curved along the bottom inside the ring: what the ring measures. */
@Composable
private fun GoalReadout(
  presentation: ScreenPresentation,
  accent: AccentPalette,
  ambient: Boolean,
  modifier: Modifier,
) {
  val percent =
    CurvedTextStyle(
      numberStyle(11.sp).copy(color = if (ambient) Ink.secondary else Color(accent.ink))
    )
  val target =
    CurvedTextStyle(telemetryStyle(10.sp).copy(color = Ink.tertiary, letterSpacing = 0.04.em))
  CurvedLayout(
    modifier,
    anchor = 90f,
    angularDirection = CurvedDirection.Angular.CounterClockwise,
  ) {
    basicCurvedText(presentation.goalPercentText, style = percent)
    basicCurvedText(" · ${presentation.goalTargetText}", style = target)
  }
}

/** A sentence instead of numbers: locked, gone, offline, empty, importing or failing. */
@Composable
private fun MessagePage(name: String, locale: Locale, text: String, modifier: Modifier) {
  Box(modifier.dotGrid(LocalAmbient.current), contentAlignment = Alignment.Center) {
    CurvedName(name, locale, Modifier.fillMaxSize().padding(NAME_INSET))
    Column(
      Modifier.padding(horizontal = 30.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
    ) {
      Icon(
        painter = painterResource(R.drawable.sm_pulse),
        contentDescription = null,
        tint = Ink.tertiary,
        modifier = Modifier.size(width = 22.dp, height = 16.dp),
      )
      Spacer(Modifier.height(10.dp))
      Text(
        text,
        style = MaterialTheme.typography.bodyMedium,
        color = Ink.secondary,
        textAlign = TextAlign.Center,
      )
    }
  }
}

private fun TransformingLazyColumnScope.screenNumbers(
  presentation: ScreenPresentation,
  accent: AccentPalette,
  spec: TransformationSpec,
  featured: Boolean,
) {
  item {
    GoalCard(
      presentation,
      accent,
      Modifier.cardMargins().transformedHeight(this, spec),
      SurfaceTransformation(spec),
    )
  }
  item {
    TodayCard(
      presentation,
      accent,
      Modifier.cardMargins().transformedHeight(this, spec),
      SurfaceTransformation(spec),
    )
  }
  if (presentation.feed.isNotEmpty()) {
    item {
      SectionLabel(
        presentation.text.feedTitle,
        presentation,
        Modifier.cardMargins().padding(top = 8.dp, bottom = 2.dp).transformedHeight(this, spec),
      )
    }
    items(presentation.feed, key = { it.id }) { line ->
      FeedCard(
        line,
        accent,
        presentation.language.locale,
        Modifier.cardMargins().transformedHeight(this, spec),
        SurfaceTransformation(spec),
      )
    }
  }
  if (featured) {
    item { OnTile(accent, Modifier.cardMargins().padding(vertical = 10.dp)) }
  }
}

private fun Modifier.cardMargins() = fillMaxWidth().padding(horizontal = CARD_MARGIN)

/** The goal or next milestone: how far, how much is left, and when at this pace. */
@Composable
private fun GoalCard(
  presentation: ScreenPresentation,
  accent: AccentPalette,
  modifier: Modifier,
  transformation: SurfaceTransformation,
) {
  val ambient = LocalAmbient.current
  GlassCard(modifier, transformation) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      TelemetryLabel(presentation.goalTitle, presentation.language.locale, Modifier.weight(1f))
      Text(
        presentation.goalPercentText,
        style = numberStyle(12.sp),
        color = if (ambient) Ink.secondary else Color(accent.ink),
      )
    }
    Text(
      presentation.goalTargetText,
      style =
        MaterialTheme.typography.titleLarge.copy(
          fontWeight = FontWeight.SemiBold,
          fontFeatureSettings = "tnum",
        ),
      color = Ink.primary,
      maxLines = 1,
      overflow = TextOverflow.Ellipsis,
      modifier = Modifier.padding(top = 2.dp),
    )
    GoalBar(
      presentation.goal.progress,
      accent,
      Modifier.padding(top = 6.dp).fillMaxWidth().height(8.dp),
    )
    Spacer(Modifier.height(6.dp))
    Text(
      presentation.goalRemainingText,
      style = MaterialTheme.typography.bodySmall,
      color = Ink.secondary,
      maxLines = 1,
    )
    presentation.goalEtaText?.let {
      Text(it, style = MaterialTheme.typography.bodySmall, color = Ink.tertiary, maxLines = 2)
    }
  }
}

/** Cash today against yesterday, and this month so far against the previous one. */
@Composable
private fun TodayCard(
  presentation: ScreenPresentation,
  accent: AccentPalette,
  modifier: Modifier,
  transformation: SurfaceTransformation,
) {
  val locale = presentation.language.locale
  val ambient = LocalAmbient.current
  GlassCard(modifier, transformation) {
    TelemetryLabel(presentation.text.revenueToday, locale)
    Text(presentation.revenueTodayText, style = amountStyle(), color = Ink.primary, maxLines = 1)
    Text(
      presentation.revenueYesterdayText,
      style = MaterialTheme.typography.bodySmall,
      color = Ink.tertiary,
      maxLines = 1,
    )
    // Dp.Hairline is one pixel for borders only: as a size it is nothing.
    Box(Modifier.padding(vertical = 9.dp).fillMaxWidth().height(1.dp).background(Ink.hairline))
    TelemetryLabel(presentation.text.thisMonth, locale)
    Text(presentation.monthToDateText, style = amountStyle(), color = Ink.primary, maxLines = 1)
    Row(verticalAlignment = Alignment.CenterVertically) {
      presentation.monthChange?.let { change ->
        val up = change >= 0
        Text(
          "${if (up) "▲" else "▼"} ${presentation.monthChangeText}",
          style = MaterialTheme.typography.labelSmall.copy(fontFeatureSettings = "tnum"),
          color = if (up && !ambient) Color(accent.ink) else Ink.secondary,
          maxLines = 1,
        )
        Spacer(Modifier.width(5.dp))
      }
      Text(
        presentation.versusPreviousMonthText,
        style = MaterialTheme.typography.bodySmall,
        color = Ink.tertiary,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
    }
  }
}

/** "— LATEST ACTIVITY —". */
@Composable
private fun SectionLabel(text: String, presentation: ScreenPresentation, modifier: Modifier) {
  Row(
    modifier,
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.Center,
  ) {
    Box(Modifier.width(14.dp).height(1.dp).background(Ink.tertiary.copy(alpha = 0.5f)))
    TelemetryLabel(
      text,
      presentation.language.locale,
      Modifier.padding(horizontal = 6.dp),
      textAlign = TextAlign.Center,
    )
    Box(Modifier.width(14.dp).height(1.dp).background(Ink.tertiary.copy(alpha = 0.5f)))
  }
}

/** What happened, as a log line: when and what, the amount, then who. */
@Composable
private fun FeedCard(
  line: FeedLine,
  accent: AccentPalette,
  locale: Locale,
  modifier: Modifier,
  transformation: SurfaceTransformation,
) {
  GlassCard(
    modifier,
    transformation,
    contentPadding = PaddingValues(start = 10.dp, end = 14.dp, top = 9.dp, bottom = 10.dp),
  ) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      EventBadge(line.icon, line.isGoodNews, accent, size = 30.dp, contentDescription = null)
      Spacer(Modifier.width(9.dp))
      Column(Modifier.weight(1f)) {
        // The time first, like a log: the kind is cut before it, the icon says it too.
        TelemetryLabel(
          "${line.time} · ${line.kindLabel}",
          locale,
          fontSize = 9.sp,
          letterSpacing = 0.08.em,
        )
        Row(verticalAlignment = Alignment.Bottom) {
          Text(
            line.headline,
            style = MaterialTheme.typography.titleSmall.copy(fontFeatureSettings = "tnum"),
            color = Ink.primary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f, fill = false),
          )
          line.metricSuffix?.let {
            Text(
              " $it",
              style = telemetryStyle(9.sp),
              color = Ink.tertiary,
              maxLines = 1,
              modifier = Modifier.padding(bottom = 2.dp),
            )
          }
        }
        if (line.who.isNotEmpty())
          Text(
            line.who,
            style = MaterialTheme.typography.bodySmall,
            color = Ink.secondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
          )
      }
    }
  }
}

/** The featured screen says it is the one of the tile and the complications. */
@Composable
private fun OnTile(accent: AccentPalette, modifier: Modifier) {
  Row(
    modifier,
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.Center,
  ) {
    Box(Modifier.size(5.dp).background(Color(accent.glow), CircleShape))
    Spacer(Modifier.width(6.dp))
    Text(
      stringResource(R.string.on_tile),
      style = MaterialTheme.typography.labelSmall,
      color = Ink.tertiary,
    )
  }
}

@Composable
private fun amountStyle() =
  MaterialTheme.typography.numeralExtraSmall.copy(
    fontWeight = FontWeight.SemiBold,
    fontFeatureSettings = "tnum",
  )

private fun numberStyle(size: TextUnit) =
  TextStyle(fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold, fontSize = size)

@Preview(device = WearDevices.LARGE_ROUND, showSystemUi = true)
@Composable
private fun ScreenDetailPreview() {
  val screen = SharedScreen("a1", "Acme Analytics", "https://saas-monitor.com", "t", null)
  ScreenDetailScreen(
    item =
      ScreenItem(
        screen,
        CachedScreen(SampleSnapshots.acme(), System.currentTimeMillis(), null),
        featured = false,
      ),
    onFeature = {},
  )
}

@Preview(device = WearDevices.SMALL_ROUND, showSystemUi = true)
@Composable
private fun ScreenDetailFrenchArrPreview() {
  val screen = SharedScreen("a1", "Acme", "https://saas-monitor.com", "t", null)
  val snapshot = SampleSnapshots.acme(accent = "amber", language = Language.FR, metric = Metric.ARR)
  ScreenDetailScreen(
    item = ScreenItem(screen, CachedScreen(snapshot, 0, null), featured = true),
    onFeature = {},
  )
}

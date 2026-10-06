package com.saasmonitor.wear.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.core.state.ScreenProblem
import com.saasmonitor.core.state.ScreenSnapshot
import kotlinx.coroutines.delay

/** Whether a screen's numbers are live, and the words to say it: "Live", or their age. */
internal data class Freshness(val live: Boolean, val label: String)

/** The app polls every 10 seconds: numbers a few polls old, or not refreshed, are not live. */
private const val LIVE_WINDOW_MILLIS = 45_000L

internal fun freshness(
  cached: CachedScreen,
  presentation: ScreenPresentation,
  now: Long,
): Freshness =
  if (cached.problem == null && now - cached.fetchedAt < LIVE_WINDOW_MILLIS)
    Freshness(live = true, label = presentation.text.live)
  else Freshness(live = false, label = presentation.timeAgo(cached.fetchedAt))

/** The time, ticking every [periodMillis]: ages and feed times keep up while nothing changes. */
@Composable
internal fun rememberNow(periodMillis: Long = 15_000): Long {
  val now by
    produceState(System.currentTimeMillis()) {
      while (true) {
        delay(periodMillis)
        value = System.currentTimeMillis()
      }
    }
  return now
}

/** Why a screen shows no numbers, in its language; `null` when it has some. */
internal fun screenMessage(cached: CachedScreen): String? {
  val snapshot = cached.snapshot
  val text = (snapshot?.settings?.language ?: Language.EN).text
  return when {
    cached.problem == ScreenProblem.LOCKED -> text.locked
    cached.problem == ScreenProblem.GONE -> text.gone
    snapshot == null && cached.problem == ScreenProblem.OFFLINE -> text.offline
    snapshot?.status == ScreenSnapshot.Status.EMPTY -> text.empty
    snapshot?.status == ScreenSnapshot.Status.IMPORTING -> text.importing
    snapshot?.status == ScreenSnapshot.Status.ERROR -> text.failing
    else -> null
  }
}

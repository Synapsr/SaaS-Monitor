package com.saasmonitor.wear.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.moments.Moment
import com.saasmonitor.core.moments.MomentCard
import com.saasmonitor.core.moments.MomentTracker
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.wear.data.WatchScreens
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** A screen on the watch, with what is known of it. */
data class ScreenItem(val screen: SharedScreen, val cached: CachedScreen, val featured: Boolean)

/** A moment on the watch: what happened, on which screen, in its accent. */
data class WatchMoment(
  val id: String,
  val screenName: String,
  val accent: String,
  /** The screen's language: its labels are uppercased with its rules. */
  val language: Language,
  val card: MomentCard,
  val isMilestone: Boolean,
)

/**
 * The watch's screens and their states, fetched directly from each screen's instance. While the app
 * is in the foreground ([poll]), it watches them like a wall display: what just happened plays as
 * moments, one after the other.
 */
class ScreensViewModel(application: Application) : AndroidViewModel(application) {
  private val screens = WatchScreens(application)
  private val repository = WatchScreens.repository(application)
  private val states = MutableStateFlow<Map<String, CachedScreen>>(emptyMap())
  private val featuredKey = MutableStateFlow(screens.featuredKey)
  /** Touched on the main thread only, like everything in `viewModelScope`. */
  private val trackers = mutableMapOf<String, MomentTracker>()
  private val queue = MutableStateFlow<List<WatchMoment>>(emptyList())

  /** `null` until the screens are read. */
  val items: StateFlow<List<ScreenItem>?> =
    combine(screens.observe(), states, featuredKey) { list, cached, featured ->
        list.mapIndexed { index, screen ->
          ScreenItem(
            screen = screen,
            cached = cached[screen.key] ?: CachedScreen.NONE,
            featured = screen.key == featured || (featured == null && index == 0),
          )
        }
      }
      .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

  /** The moment on screen: the first of the queue. */
  val moment: StateFlow<WatchMoment?> =
    queue.map { it.firstOrNull() }.stateIn(viewModelScope, SharingStarted.Eagerly, null)

  init {
    viewModelScope.launch {
      screens.syncFromPhone()
      // The last known numbers at once, before the first poll fetches them.
      for (screen in screens.all()) states.update {
        it + (screen.key to repository.cached(screen.key))
      }
    }
    viewModelScope.launch { playMoments() }
  }

  /**
   * Fetches every screen every [POLL_MILLIS], for as long as the caller runs it: the app does while
   * it is in the foreground, and stops in ambient mode or when the screen goes off. Its first
   * states are the baseline: what was there when the app opened never plays again.
   */
  suspend fun poll() {
    trackers.clear()
    while (true) {
      coroutineScope { screens.all().map { async { fetch(it) } }.awaitAll() }
      delay(POLL_MILLIS)
    }
  }

  fun feature(key: String) {
    screens.feature(key)
    featuredKey.value = key
  }

  /** Forgets the moments waiting, e.g. when the watch dozes: they'd be old news. */
  fun clearMoments() {
    queue.value = emptyList()
  }

  /** Skips to the next moment, e.g. when the moment on screen is tapped. */
  fun dismissMoment(id: String) {
    queue.update { moments -> if (moments.firstOrNull()?.id == id) moments.drop(1) else moments }
  }

  private suspend fun fetch(screen: SharedScreen) {
    val refresh = repository.fetch(screen)
    states.update { it + (screen.key to refresh.cached) }
    val state = refresh.fetched ?: return
    val (tracker, moments) = (trackers[screen.key] ?: MomentTracker()).track(state)
    trackers[screen.key] = tracker
    val shown = moments.map {
      WatchMoment(
        id = "${screen.key}:${it.id}",
        screenName = screen.name,
        accent = state.settings.accent,
        language = state.settings.language,
        card = MomentCard.of(it, state),
        isMilestone = it is Moment.Milestone,
      )
    }
    if (shown.isNotEmpty()) queue.update { (it + shown).take(MAX_QUEUED) }
  }

  /** Each moment stays a few seconds, shorter when others wait: the watch never lags behind. */
  private suspend fun playMoments() {
    queue
      .map { it.firstOrNull()?.id }
      .distinctUntilChanged()
      .collectLatest { id ->
        if (id == null) return@collectLatest
        val moments = queue.value
        val moment = moments.first()
        val base = if (moment.isMilestone) MILESTONE_MILLIS else MOMENT_MILLIS
        delay(if (moments.size > 1) maxOf(SHORTEST_MILLIS, base / 2) else base)
        dismissMoment(id)
      }
  }

  private companion object {
    /** Wall displays poll every 10 seconds. */
    const val POLL_MILLIS = 10_000L
    const val MOMENT_MILLIS = 5_000L
    const val MILESTONE_MILLIS = 6_500L
    const val SHORTEST_MILLIS = 3_200L
    /** Bursts are summed up per account already: a longer queue would only lag. */
    const val MAX_QUEUED = 8
  }
}

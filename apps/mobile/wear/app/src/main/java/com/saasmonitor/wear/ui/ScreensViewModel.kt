package com.saasmonitor.wear.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.wear.data.WatchScreens
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** A screen on the watch, with what is known of it. */
data class ScreenItem(val screen: SharedScreen, val cached: CachedScreen, val featured: Boolean)

/** The watch's screens and their states, fetched directly from each screen's instance. */
class ScreensViewModel(application: Application) : AndroidViewModel(application) {
  private val screens = WatchScreens(application)
  private val repository = WatchScreens.repository(application)
  private val states = MutableStateFlow<Map<String, CachedScreen>>(emptyMap())
  private val featuredKey = MutableStateFlow(screens.featuredKey)

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

  init {
    viewModelScope.launch {
      screens.syncFromPhone()
      refreshAll()
    }
  }

  /** Shows the last known numbers at once, then fetches every screen. */
  fun refreshAll() {
    viewModelScope.launch {
      for (screen in screens.all()) {
        states.update { it + (screen.key to repository.cached(screen.key)) }
        launch { refresh(screen) }
      }
    }
  }

  fun refresh(key: String) {
    viewModelScope.launch { screens.all().firstOrNull { it.key == key }?.let { refresh(it) } }
  }

  fun feature(key: String) {
    screens.feature(key)
    featuredKey.value = key
  }

  private suspend fun refresh(screen: SharedScreen) {
    val cached = repository.refresh(screen)
    states.update { it + (screen.key to cached) }
  }
}

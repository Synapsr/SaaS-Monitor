package com.saasmonitor.screenbridge.widget

import androidx.datastore.preferences.core.Preferences
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.ScreenProblem
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.core.state.Theme

/** What a widget shows, read from its Glance state. */
internal data class WidgetModel(
  val screenKey: String?,
  /** The screen's name in the app, else on its server. */
  val screenName: String?,
  val accent: String,
  val theme: Theme,
  val palette: WidgetPalette,
  val content: Content,
) {
  sealed interface Content {
    /** The app has no screen yet. */
    data object NoScreens : Content

    /** The widget's screen was removed from the app: another one must be chosen. */
    data object ScreenRemoved : Content

    /** Waiting for the screen's first state. */
    data object Loading : Content

    /** The screen can't show numbers: locked, gone, empty, importing or failing. */
    data class Message(val text: String) : Content

    data class Ready(
      val presentation: ScreenPresentation,
      /** "2 h ago" when the numbers are older than a refresh or two (offline), else `null`. */
      val updatedAgo: String?,
    ) : Content
  }

  companion object {
    /** Numbers older than this say when they are from: refreshes run every 15 minutes. */
    private const val STALE_AFTER_MILLIS = 45 * 60_000L
    private const val DEFAULT_ACCENT = "emerald"

    fun from(preferences: Preferences, now: Long = System.currentTimeMillis()): WidgetModel {
      val cached = WidgetState.cached(preferences)
      val snapshot = cached.snapshot
      val text = (snapshot?.settings?.language ?: Language.EN).text
      val content =
        when {
          preferences[WidgetState.noScreens] == true -> Content.NoScreens
          preferences[WidgetState.screenRemoved] == true -> Content.ScreenRemoved
          cached.problem == ScreenProblem.LOCKED -> Content.Message(text.locked)
          cached.problem == ScreenProblem.GONE -> Content.Message(text.gone)
          snapshot == null -> Content.Loading
          snapshot.status == ScreenSnapshot.Status.EMPTY -> Content.Message(text.empty)
          snapshot.status == ScreenSnapshot.Status.IMPORTING -> Content.Message(text.importing)
          snapshot.status == ScreenSnapshot.Status.ERROR -> Content.Message(text.failing)
          else -> {
            val presentation = ScreenPresentation(snapshot, now)
            val stale = now - cached.fetchedAt > STALE_AFTER_MILLIS
            Content.Ready(presentation, if (stale) presentation.timeAgo(cached.fetchedAt) else null)
          }
        }
      return WidgetModel(
        screenKey = preferences[WidgetState.screenKey],
        screenName = preferences[WidgetState.screenName] ?: snapshot?.screenName,
        accent = snapshot?.settings?.accent ?: DEFAULT_ACCENT,
        theme = snapshot?.settings?.theme ?: Theme.DARK,
        palette = WidgetState.palette(preferences),
        content = content,
      )
    }
  }
}

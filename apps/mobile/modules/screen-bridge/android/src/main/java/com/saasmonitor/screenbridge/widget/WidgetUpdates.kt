package com.saasmonitor.screenbridge.widget

import android.content.Context
import androidx.datastore.preferences.core.MutablePreferences
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import com.saasmonitor.core.ScreenStore
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.core.state.CachedScreenJson
import com.saasmonitor.core.state.ScreenRepository

/** Keeps every home screen widget in step with the app's screens and their states. */
internal object WidgetUpdates {
  /** One instance of each widget the app declares (`plugins/withAndroidWidgets.ts`). */
  private val widgets: List<GlanceAppWidget> = listOf(MrrWidget(), OverviewWidget())

  /** The app handed new screens: forget removed ones and refresh the widgets. */
  suspend fun screensChanged(context: Context, screens: List<SharedScreen>) {
    ScreenRepository(context).retainOnly(screens.map { it.key }.toSet())
    GeneratedPreviews.publishOnce(context)
    if (widgetIds(context).isNotEmpty()) {
      WidgetRefreshWorker.schedule(context)
      WidgetRefreshWorker.refreshNow(context)
    }
  }

  /**
   * Fetches each widget's screen, once per screen, and redraws the widgets. A widget placed without
   * configuration shows the app's first screen.
   */
  suspend fun refreshAll(context: Context) {
    val screens = ScreenStore(context).load()
    val byKey = screens.associateBy { it.key }
    val repository = ScreenRepository(context)
    val fetched = mutableMapOf<String, CachedScreen>()
    for ((widget, id) in widgetIds(context)) {
      val state = getAppWidgetState(context, PreferencesGlanceStateDefinition, id)
      val screen = (state[WidgetState.screenKey] ?: screens.firstOrNull()?.key)?.let(byKey::get)
      val cached = screen?.let { fetched.getOrPut(it.key) { repository.refresh(it) } }
      updateAppWidgetState(context, id) { preferences ->
        preferences.write(hasScreens = screens.isNotEmpty(), screen = screen, cached = cached)
      }
      widget.update(context, id)
    }
  }

  /** The configuration chose [screen] for the widget [id]: show what is known of it at once. */
  suspend fun assign(context: Context, id: GlanceId, screen: SharedScreen, palette: WidgetPalette) {
    val cached = ScreenRepository(context).cached(screen.key)
    updateAppWidgetState(context, id) { preferences ->
      preferences[WidgetState.palette] = palette.name
      preferences.write(hasScreens = true, screen = screen, cached = cached)
    }
    widgetIds(context)
      .filter { it.second == id }
      .forEach { (widget, _) -> widget.update(context, id) }
    WidgetRefreshWorker.schedule(context)
    WidgetRefreshWorker.refreshNow(context)
  }

  suspend fun widgetIds(context: Context): List<Pair<GlanceAppWidget, GlanceId>> {
    val manager = GlanceAppWidgetManager(context)
    return widgets.flatMap { widget -> manager.getGlanceIds(widget.javaClass).map { widget to it } }
  }

  private fun MutablePreferences.write(
    hasScreens: Boolean,
    screen: SharedScreen?,
    cached: CachedScreen?,
  ) {
    this[WidgetState.noScreens] = !hasScreens
    // A removed screen keeps its key: the widget comes back if the app gets the screen again.
    this[WidgetState.screenRemoved] = hasScreens && screen == null
    if (screen != null) {
      this[WidgetState.screenKey] = screen.key
      this[WidgetState.screenName] = screen.name
      this[WidgetState.cached] = CachedScreenJson.encode(cached ?: CachedScreen.NONE)
    }
  }
}

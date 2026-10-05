package com.saasmonitor.screenbridge.widget

import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import com.saasmonitor.core.state.CachedScreen
import com.saasmonitor.core.state.CachedScreenJson

/** How a widget paints itself: like its screen, or with the wallpaper's colors (Android 12+). */
enum class WidgetPalette {
  /** The screen's theme and accent, like the wall display. */
  SCREEN,
  /** Material You surfaces from the wallpaper, with the screen's accent for its numbers. */
  SYSTEM,
}

/**
 * What each widget keeps in its Glance state: which screen it shows and the screen's last known
 * state. Writing it and calling `update` is what redraws a widget.
 */
internal object WidgetState {
  val screenKey = stringPreferencesKey("screen_key")
  /** The screen's name in the app. */
  val screenName = stringPreferencesKey("screen_name")
  val palette = stringPreferencesKey("palette")
  /** `CachedScreenJson` of the screen. */
  val cached = stringPreferencesKey("cached")
  /** The app has no screen under [screenKey] any more. */
  val screenRemoved = booleanPreferencesKey("screen_removed")
  /** The app has no screen at all. */
  val noScreens = booleanPreferencesKey("no_screens")

  fun palette(preferences: Preferences): WidgetPalette =
    WidgetPalette.entries.firstOrNull { it.name == preferences[palette] } ?: WidgetPalette.SCREEN

  fun cached(preferences: Preferences): CachedScreen = CachedScreenJson.decode(preferences[cached])
}

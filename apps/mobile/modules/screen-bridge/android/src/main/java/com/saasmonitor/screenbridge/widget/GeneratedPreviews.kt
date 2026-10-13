package com.saasmonitor.screenbridge.widget

import android.content.Context
import android.os.Build
import androidx.core.content.edit
import androidx.core.content.pm.PackageInfoCompat
import androidx.glance.appwidget.GlanceAppWidgetManager

/**
 * Publishes the widget picker's previews on Android 15+, drawn by the widgets themselves from
 * sample numbers (`ScreenWidget.providePreview`). The system rate-limits it: once per app version.
 */
internal object GeneratedPreviews {
  private const val PREFERENCES = "screen-bridge"
  private const val PUBLISHED_VERSION = "previews-version"

  suspend fun publishOnce(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return
    val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
    val version =
      PackageInfoCompat.getLongVersionCode(
        context.packageManager.getPackageInfo(context.packageName, 0)
      )
    if (preferences.getLong(PUBLISHED_VERSION, -1) == version) return
    val manager = GlanceAppWidgetManager(context)
    val results = RECEIVERS.map { manager.setWidgetPreviews(it) }
    if (results.all { it == GlanceAppWidgetManager.SET_WIDGET_PREVIEWS_RESULT_SUCCESS }) {
      preferences.edit { putLong(PUBLISHED_VERSION, version) }
    }
  }

  private val RECEIVERS = listOf(MrrWidgetReceiver::class, OverviewWidgetReceiver::class)
}

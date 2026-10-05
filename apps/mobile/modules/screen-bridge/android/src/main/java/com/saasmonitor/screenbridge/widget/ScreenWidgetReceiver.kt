package com.saasmonitor.screenbridge.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import androidx.glance.appwidget.GlanceAppWidgetReceiver

/**
 * Receives the launcher's widget events. A placed widget fetches its screen at once and joins the
 * periodic refresh, which stops with the last widget of the app.
 */
abstract class ScreenWidgetReceiver : GlanceAppWidgetReceiver() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)
    WidgetRefreshWorker.schedule(context)
    WidgetRefreshWorker.refreshNow(context)
  }

  override fun onDisabled(context: Context) {
    super.onDisabled(context)
    val manager = AppWidgetManager.getInstance(context)
    val remaining = RECEIVERS.sumOf { manager.getAppWidgetIds(ComponentName(context, it)).size }
    if (remaining == 0) WidgetRefreshWorker.cancel(context)
  }

  private companion object {
    val RECEIVERS = listOf(MrrWidgetReceiver::class.java, OverviewWidgetReceiver::class.java)
  }
}

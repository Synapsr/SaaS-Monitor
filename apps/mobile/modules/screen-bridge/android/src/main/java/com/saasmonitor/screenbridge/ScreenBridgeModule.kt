package com.saasmonitor.screenbridge

import android.content.Context
import com.saasmonitor.core.ScreenStore
import com.saasmonitor.screenbridge.widget.WidgetRefreshWorker
import com.saasmonitor.screenbridge.widget.WidgetUpdates
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Shares the app's screens with its home screen widgets and paired Wear OS watches. */
class ScreenBridgeModule : Module() {
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ScreenBridge")

    AsyncFunction("setScreens") Coroutine
      { records: List<SharedScreenRecord> ->
        val screens = records.mapNotNull(SharedScreenRecord::toSharedScreen)
        ScreenStore(context).save(screens)
        WidgetUpdates.screensChanged(context, screens)
        WearSync(context).sendScreens(screens)
      }

    AsyncFunction("reloadWidgets") Coroutine
      { ->
        WidgetRefreshWorker.refreshNow(context)
        WearSync(context).requestReload()
      }
  }
}

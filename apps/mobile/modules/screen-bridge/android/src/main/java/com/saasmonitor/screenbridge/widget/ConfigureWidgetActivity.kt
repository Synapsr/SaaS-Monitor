package com.saasmonitor.screenbridge.widget

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.lifecycle.lifecycleScope
import com.saasmonitor.core.ScreenStore
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.state.ScreenRepository
import kotlinx.coroutines.launch

/**
 * Lets the user pick the screen a widget shows, and its colors: when it is placed (before Android
 * 12), or from "Reconfigure" on its long-press menu. Leaving without a choice cancels.
 */
class ConfigureWidgetActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    val appWidgetId =
      intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
    setResult(RESULT_CANCELED, resultFor(appWidgetId))
    if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
      finish()
      return
    }
    val glanceId = GlanceAppWidgetManager(this).getGlanceIdBy(appWidgetId)

    setContent {
      val options by
        produceState<ConfigureOptions?>(initialValue = null) {
          val screens = ScreenStore(applicationContext).load()
          val repository = ScreenRepository(applicationContext)
          val state =
            getAppWidgetState(applicationContext, PreferencesGlanceStateDefinition, glanceId)
          value =
            ConfigureOptions(
              screens = screens.map { ScreenChoice(it, repository.cached(it.key).snapshot) },
              selectedKey = state[WidgetState.screenKey],
              palette = WidgetState.palette(state),
              wallpaperColors = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S,
            )
        }
      ConfigureTheme {
        ConfigureWidgetScreen(
          options = options,
          onChoose = { screen, palette -> choose(appWidgetId, screen, palette) },
          onOpenApp = {
            startActivity(WidgetLinks(this).app())
            finish()
          },
        )
      }
    }
  }

  private fun choose(appWidgetId: Int, screen: SharedScreen, palette: WidgetPalette) {
    lifecycleScope.launch {
      val glanceId = GlanceAppWidgetManager(applicationContext).getGlanceIdBy(appWidgetId)
      WidgetUpdates.assign(applicationContext, glanceId, screen, palette)
      setResult(RESULT_OK, resultFor(appWidgetId))
      finish()
    }
  }

  private fun resultFor(appWidgetId: Int) =
    Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
}

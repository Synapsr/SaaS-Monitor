package com.saasmonitor.wear

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.saasmonitor.wear.data.WatchScreens
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Debug builds only: gives the watch screens without a paired phone, as the Data Layer would.
 *
 * `adb shell am broadcast -a com.saasmonitor.wear.DEBUG_SCREENS -n
 * com.saasmonitor.app/com.saasmonitor.wear.DebugScreensReceiver --es screens '[{"key":…}]'`
 */
class DebugScreensReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val json = intent.getStringExtra("screens") ?: return
    val pending = goAsync()
    CoroutineScope(Dispatchers.IO).launch {
      try {
        WatchScreens(context).receive(json)
      } finally {
        pending.finish()
      }
    }
  }
}

package com.saasmonitor.wear.data

import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import com.saasmonitor.core.WearContract
import kotlinx.coroutines.runBlocking

/** Receives the phone's screens and its requests to refresh, even when the app is not running. */
class PhoneListenerService : WearableListenerService() {
  override fun onDataChanged(events: DataEventBuffer) {
    // Read before returning: the buffer is released after this call.
    val json =
      events
        .filter {
          it.type == DataEvent.TYPE_CHANGED && it.dataItem.uri.path == WearContract.SCREENS_PATH
        }
        .lastOrNull()
        ?.let { DataMapItem.fromDataItem(it.dataItem).dataMap.getString(WearContract.SCREENS_KEY) }
        ?: return
    // Listener callbacks run on a background thread, and the service may stop once they return.
    runBlocking { WatchScreens(this@PhoneListenerService).receive(json) }
  }

  override fun onMessageReceived(event: MessageEvent) {
    if (event.path == WearContract.RELOAD_PATH) WatchSurfaces.refresh(this)
  }
}

package com.saasmonitor.screenbridge

import android.content.Context
import android.util.Log
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.SharedScreenJson
import com.saasmonitor.core.WearContract
import kotlinx.coroutines.tasks.await

/**
 * Hands the screens to paired Wear OS watches through the Wearable Data Layer: a data item the
 * watch app receives even when it is not running, and that reaches watches paired later. The Data
 * Layer is encrypted and only shared with this app, signed with the same key, on the watch.
 */
internal class WearSync(context: Context) {
  private val dataClient = Wearable.getDataClient(context)
  private val messageClient = Wearable.getMessageClient(context)
  private val nodeClient = Wearable.getNodeClient(context)

  suspend fun sendScreens(screens: List<SharedScreen>) {
    val request =
      PutDataMapRequest.create(WearContract.SCREENS_PATH)
        .apply { dataMap.putString(WearContract.SCREENS_KEY, SharedScreenJson.encode(screens)) }
        .asPutDataRequest()
        .setUrgent()
    ignoringMissingWearOs { dataClient.putDataItem(request).await() }
  }

  /** Asks connected watches to refresh their tile and complications, e.g. after a notification. */
  suspend fun requestReload() {
    ignoringMissingWearOs {
      for (node in nodeClient.connectedNodes.await()) {
        messageClient.sendMessage(node.id, WearContract.RELOAD_PATH, null).await()
      }
    }
  }

  /** Phones without the Wear OS app (most of them) have no Data Layer: nothing to sync then. */
  private suspend fun ignoringMissingWearOs(block: suspend () -> Unit) {
    try {
      block()
    } catch (error: ApiException) {
      Log.d(TAG, "Wearable Data Layer unavailable: ${error.statusCode}")
    }
  }

  private companion object {
    const val TAG = "WearSync"
  }
}

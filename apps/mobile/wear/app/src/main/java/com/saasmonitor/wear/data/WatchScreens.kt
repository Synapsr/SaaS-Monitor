package com.saasmonitor.wear.data

import android.content.Context
import android.net.Uri
import androidx.core.content.edit
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.saasmonitor.core.ScreenStore
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.SharedScreenJson
import com.saasmonitor.core.WearContract
import com.saasmonitor.core.state.ScreenRepository
import com.saasmonitor.core.state.ScreenStateClient
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.tasks.await

/**
 * The screens on the watch: sent by the phone over the Data Layer, stored encrypted like on the
 * phone, and the one the tile and complications show.
 */
class WatchScreens(context: Context) {
  private val context = context.applicationContext
  private val store = ScreenStore(this.context)
  private val preferences = this.context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)

  fun observe(): Flow<List<SharedScreen>> = store.observe()

  suspend fun all(): List<SharedScreen> = store.load()

  /** The screen of the tile and complications: the one chosen on the watch, else the first. */
  suspend fun featured(): SharedScreen? {
    val screens = all()
    return screens.firstOrNull { it.key == featuredKey } ?: screens.firstOrNull()
  }

  val featuredKey: String?
    get() = preferences.getString(FEATURED_KEY, null)

  fun feature(key: String) {
    preferences.edit { putString(FEATURED_KEY, key) }
    WatchSurfaces.refresh(context)
  }

  /** Stores the screens the phone sent, and forgets the states of removed ones. */
  suspend fun receive(json: String) {
    val screens = SharedScreenJson.decode(json)
    store.save(screens)
    repository().retainOnly(screens.map { it.key }.toSet())
    WatchSurfaces.refresh(context)
  }

  /**
   * Reads the phone's data item directly: the listener may have missed it before a first launch.
   */
  suspend fun syncFromPhone() {
    val uri = Uri.Builder().scheme("wear").path(WearContract.SCREENS_PATH).build()
    val items =
      try {
        Wearable.getDataClient(context).getDataItems(uri).await()
      } catch (_: ApiException) {
        return
      }
    val json =
      try {
        items.firstOrNull()?.let {
          DataMapItem.fromDataItem(it).dataMap.getString(WearContract.SCREENS_KEY)
        }
      } finally {
        items.release()
      }
    if (json != null) receive(json)
  }

  companion object {
    private const val PREFERENCES = "watch"
    private const val FEATURED_KEY = "featured-screen"

    /** Tiles and complications must answer quickly: they wait less than the app. */
    fun repository(context: Context, timeoutMillis: Int = 10_000) =
      ScreenRepository(context, ScreenStateClient(timeoutMillis))
  }

  private fun repository() = repository(context)
}

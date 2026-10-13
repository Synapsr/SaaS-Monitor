package com.saasmonitor.wear.tile

import androidx.concurrent.futures.SuspendToFutureAdapter
import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ModifiersBuilders.Clickable
import androidx.wear.protolayout.ResourceBuilders.Resources
import androidx.wear.protolayout.modifiers.clickable
import androidx.wear.tiles.RequestBuilders.ResourcesRequest
import androidx.wear.tiles.RequestBuilders.TileRequest
import androidx.wear.tiles.TileBuilders.Tile
import androidx.wear.tiles.TileService
import androidx.wear.tiles.tile
import androidx.wear.tiles.timeline
import androidx.wear.tiles.timelineEntry
import com.google.common.util.concurrent.ListenableFuture
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.ScreenProblem
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.wear.MainActivity
import com.saasmonitor.wear.R
import com.saasmonitor.wear.data.WatchScreens
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

/**
 * The MRR tile, for the screen featured on the watch. Each request fetches the screen (quickly,
 * falling back to its last known state); the system asks again every 15 minutes, and at once when
 * the phone signals news.
 */
class MrrTileService : TileService() {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  override fun onTileRequest(requestParams: TileRequest): ListenableFuture<Tile> =
    SuspendToFutureAdapter.launchFuture(scope.coroutineContext) {
      val layout =
        mrrTileLayout(this@MrrTileService, requestParams.deviceConfiguration, content(), openApp())
      tile(
        timeline = timeline(timelineEntry(layout)),
        freshness = 15.minutes,
        resourcesVersion = RESOURCES_VERSION,
      )
    }

  override fun onTileResourcesRequest(
    requestParams: ResourcesRequest
  ): ListenableFuture<Resources> =
    SuspendToFutureAdapter.launchFuture(scope.coroutineContext) {
      Resources.Builder().setVersion(RESOURCES_VERSION).build()
    }

  override fun onDestroy() {
    scope.cancel()
    super.onDestroy()
  }

  private suspend fun content(): TileContent {
    val screen =
      WatchScreens(this).featured()
        ?: return TileContent.Message(null, getString(R.string.no_screens_tile))
    val cached = WatchScreens.repository(this, timeoutMillis = 6_000).refresh(screen)
    val snapshot = cached.snapshot
    val text = (snapshot?.settings?.language ?: Language.EN).text
    return when {
      cached.problem == ScreenProblem.LOCKED -> TileContent.Message(screen.name, text.locked)
      cached.problem == ScreenProblem.GONE -> TileContent.Message(screen.name, text.gone)
      snapshot == null && cached.problem == ScreenProblem.OFFLINE ->
        TileContent.Message(screen.name, text.offline)
      snapshot == null -> TileContent.Message(screen.name, getString(R.string.loading))
      snapshot.status == ScreenSnapshot.Status.EMPTY -> TileContent.Message(screen.name, text.empty)
      snapshot.status == ScreenSnapshot.Status.IMPORTING ->
        TileContent.Message(screen.name, text.importing)
      snapshot.status == ScreenSnapshot.Status.ERROR ->
        TileContent.Message(screen.name, text.failing)
      else -> TileContent.Ready(screen.name, ScreenPresentation(snapshot))
    }
  }

  private fun openApp(): Clickable =
    clickable(
      action =
        ActionBuilders.LaunchAction.Builder()
          .setAndroidActivity(
            ActionBuilders.AndroidActivity.Builder()
              .setPackageName(packageName)
              .setClassName(MainActivity::class.java.name)
              .build()
          )
          .build(),
      id = "open",
    )

  private companion object {
    const val RESOURCES_VERSION = "1"
  }
}

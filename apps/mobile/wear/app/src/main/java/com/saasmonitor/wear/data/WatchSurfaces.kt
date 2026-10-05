package com.saasmonitor.wear.data

import android.content.ComponentName
import android.content.Context
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import com.saasmonitor.wear.complication.MrrComplicationService
import com.saasmonitor.wear.tile.MrrTileService

/** Asks the system to request the tile and the complications again: they fetch on request. */
object WatchSurfaces {
  fun refresh(context: Context) {
    TileService.getUpdater(context).requestUpdate(MrrTileService::class.java)
    ComplicationDataSourceUpdateRequester.create(
        context,
        ComponentName(context, MrrComplicationService::class.java),
      )
      .requestUpdateAll()
  }
}

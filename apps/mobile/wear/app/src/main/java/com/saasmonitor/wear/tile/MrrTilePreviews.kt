package com.saasmonitor.wear.tile

import android.content.Context
import androidx.wear.protolayout.modifiers.clickable
import androidx.wear.tiles.tooling.preview.Preview
import androidx.wear.tiles.tooling.preview.TilePreviewData
import androidx.wear.tiles.tooling.preview.TilePreviewHelper
import androidx.wear.tooling.preview.devices.WearDevices
import com.saasmonitor.core.display.Language
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation

/* Android Studio previews of the tile, from sample numbers. */

private fun preview(context: Context, content: TileContent) = TilePreviewData { request ->
  TilePreviewHelper.singleTimelineEntryTileBuilder(
      mrrTileLayout(context, request.deviceConfiguration, content, clickable())
    )
    .build()
}

@Preview(device = WearDevices.SMALL_ROUND)
@Preview(device = WearDevices.LARGE_ROUND)
fun mrrTilePreview(context: Context) =
  preview(context, TileContent.Ready("Acme Analytics", ScreenPresentation(SampleSnapshots.acme())))

@Preview(device = WearDevices.LARGE_ROUND)
fun mrrTileFrenchVioletPreview(context: Context) =
  preview(
    context,
    TileContent.Ready(
      "Acme",
      ScreenPresentation(SampleSnapshots.acme(accent = "violet", language = Language.FR)),
    ),
  )

@Preview(device = WearDevices.SMALL_ROUND)
fun mrrTileLockedPreview(context: Context) =
  preview(context, TileContent.Message("Acme Analytics", Language.EN.text.locked))

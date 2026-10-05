package com.saasmonitor.wear.complication

import android.app.PendingIntent
import android.content.Intent
import android.graphics.drawable.Icon
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.MonochromaticImage
import androidx.wear.watchface.complications.data.NoDataComplicationData
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.RangedValueComplicationData
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService
import com.saasmonitor.core.display.Money
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.wear.MainActivity
import com.saasmonitor.wear.R
import com.saasmonitor.wear.data.WatchScreens

/**
 * The MRR of the screen featured on the watch, for watch faces: short text ("$12.5K", titled
 * "MRR"), or a ranged value filling towards its goal.
 */
class MrrComplicationService : SuspendingComplicationDataSourceService() {
  override fun getPreviewData(type: ComplicationType): ComplicationData? =
    data(type, ScreenPresentation(SampleSnapshots.acme()), tapAction = null)

  override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? {
    val screen = WatchScreens(this).featured() ?: return NoDataComplicationData()
    val snapshot = WatchScreens.repository(this, timeoutMillis = 6_000).refresh(screen).snapshot
    if (snapshot == null || snapshot.status != ScreenSnapshot.Status.READY)
      return NoDataComplicationData()
    return data(request.complicationType, ScreenPresentation(snapshot), openApp())
  }

  private fun data(
    type: ComplicationType,
    presentation: ScreenPresentation,
    tapAction: PendingIntent?,
  ): ComplicationData? {
    val description =
      PlainComplicationText.Builder("${presentation.metricName}: ${presentation.valueText}").build()
    val value = PlainComplicationText.Builder(presentation.compactValueText).build()
    val icon =
      MonochromaticImage.Builder(Icon.createWithResource(this, R.drawable.sm_pulse)).build()
    return when (type) {
      ComplicationType.SHORT_TEXT ->
        ShortTextComplicationData.Builder(value, description)
          .setTitle(PlainComplicationText.Builder(presentation.metricLabel).build())
          .setMonochromaticImage(icon)
          .setTapAction(tapAction)
          .build()
      ComplicationType.RANGED_VALUE -> {
        val currency = presentation.snapshot.currency
        val target = Money.toMajorUnits(presentation.goal.target, currency).toFloat()
        val current =
          Money.toMajorUnits(presentation.value, currency).toFloat().coerceIn(0f, target)
        RangedValueComplicationData.Builder(current, 0f, target, description)
          .setText(value)
          .setTitle(PlainComplicationText.Builder(presentation.goalPercentText).build())
          .setMonochromaticImage(icon)
          .setTapAction(tapAction)
          .build()
      }
      else -> null
    }
  }

  private fun openApp(): PendingIntent =
    PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
}

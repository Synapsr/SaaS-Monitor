package com.saasmonitor.wear.complication

import android.app.PendingIntent
import android.content.Intent
import android.graphics.drawable.Icon
import androidx.wear.watchface.complications.data.ColorRamp
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.LongTextComplicationData
import androidx.wear.watchface.complications.data.MonochromaticImage
import androidx.wear.watchface.complications.data.NoDataComplicationData
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.RangedValueComplicationData
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.Money
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.core.state.Theme
import com.saasmonitor.wear.MainActivity
import com.saasmonitor.wear.R
import com.saasmonitor.wear.data.WatchScreens

/**
 * The MRR of the screen featured on the watch, for watch faces: the compact amount with its growth
 * ("$12.5K", "+9.9%"), the amount and growth under the screen's name, or a gauge filling towards
 * its goal in the screen's accent. Faces drawing in one color get the pulse and the words.
 */
class MrrComplicationService : SuspendingComplicationDataSourceService() {
  override fun getPreviewData(type: ComplicationType): ComplicationData? =
    data(type, ScreenPresentation(SampleSnapshots.acme()), "Acme Analytics", tapAction = null)

  override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? {
    val screen = WatchScreens(this).featured() ?: return NoDataComplicationData()
    val snapshot = WatchScreens.repository(this, timeoutMillis = 6_000).refresh(screen).snapshot
    if (snapshot == null || snapshot.status != ScreenSnapshot.Status.READY)
      return NoDataComplicationData()
    return data(request.complicationType, ScreenPresentation(snapshot), screen.name, openApp())
  }

  private fun data(
    type: ComplicationType,
    presentation: ScreenPresentation,
    name: String,
    tapAction: PendingIntent?,
  ): ComplicationData? {
    val growth = presentation.growthPercentText ?: presentation.growthAmountText
    // Read aloud: "Monthly recurring revenue: $12,480, +$1,120 · +9.9% in 30 days".
    val description =
      text(
        "${presentation.metricName}: ${presentation.valueText}, " +
          "${presentation.growthText} ${presentation.text.inThirtyDays}"
      )
    val value = text(presentation.compactValueText)
    val icon =
      MonochromaticImage.Builder(Icon.createWithResource(this, R.drawable.sm_pulse)).build()
    return when (type) {
      ComplicationType.SHORT_TEXT ->
        ShortTextComplicationData.Builder(value, description)
          .setTitle(text(growth))
          .setMonochromaticImage(icon)
          .setTapAction(tapAction)
          .build()
      ComplicationType.LONG_TEXT ->
        LongTextComplicationData.Builder(
            text("${presentation.metricLabel} ${presentation.valueText} · $growth"),
            description,
          )
          .setTitle(text(name))
          .setMonochromaticImage(icon)
          .setTapAction(tapAction)
          .build()
      ComplicationType.RANGED_VALUE -> {
        val currency = presentation.snapshot.currency
        val target = Money.toMajorUnits(presentation.goal.target, currency).toFloat()
        val current =
          Money.toMajorUnits(presentation.value, currency).toFloat().coerceIn(0f, target)
        val palette = Accents.palette(presentation.snapshot.settings.accent, Theme.DARK)
        RangedValueComplicationData.Builder(current, 0f, target, description)
          .setText(value)
          .setTitle(text(presentation.goalPercentText))
          // The ring's colors, for faces that draw the gauge in the data's colors.
          .setColorRamp(ColorRamp(intArrayOf(palette.deep, palette.glow), interpolated = true))
          .setMonochromaticImage(icon)
          .setTapAction(tapAction)
          .build()
      }
      else -> null
    }
  }

  private fun text(value: String) = PlainComplicationText.Builder(value).build()

  private fun openApp(): PendingIntent =
    PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
}

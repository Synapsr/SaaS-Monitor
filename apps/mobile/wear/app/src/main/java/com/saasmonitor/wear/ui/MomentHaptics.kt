package com.saasmonitor.wear.ui

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * A moment is felt before it is read: a firm double tap for good news, a light tick for losses.
 * They buzz as notifications do, so that Do Not Disturb and the watch's vibration setting apply.
 */
object MomentHaptics {
  fun play(context: Context, celebration: Boolean) {
    val vibrator =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.getSystemService(VibratorManager::class.java)?.defaultVibrator
      } else {
        @Suppress("DEPRECATION") context.getSystemService(Vibrator::class.java)
      }
    if (vibrator?.hasVibrator() != true) return
    val effect =
      VibrationEffect.createPredefined(
        if (celebration) VibrationEffect.EFFECT_DOUBLE_CLICK else VibrationEffect.EFFECT_TICK
      )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      vibrator.vibrate(
        effect,
        VibrationAttributes.createForUsage(VibrationAttributes.USAGE_NOTIFICATION),
      )
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(
        effect,
        AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).build(),
      )
    }
  }
}

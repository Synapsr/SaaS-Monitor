package com.saasmonitor.screenbridge.widget

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Fetches the screens of the home screen widgets and redraws them: every 15 minutes, the most
 * WorkManager allows, and at once when the app hands screens over or a notification arrives. No
 * network constraint: offline, a run still redraws widgets to say how old their numbers are.
 */
class WidgetRefreshWorker(context: Context, params: WorkerParameters) :
  CoroutineWorker(context, params) {
  override suspend fun doWork(): Result {
    WidgetUpdates.refreshAll(applicationContext)
    return Result.success()
  }

  companion object {
    private const val PERIODIC_WORK = "screen-widgets-refresh"
    private const val IMMEDIATE_WORK = "screen-widgets-refresh-now"
    private const val INTERVAL_MINUTES = 15L

    fun schedule(context: Context) {
      WorkManager.getInstance(context)
        .enqueueUniquePeriodicWork(
          PERIODIC_WORK,
          ExistingPeriodicWorkPolicy.KEEP,
          PeriodicWorkRequestBuilder<WidgetRefreshWorker>(INTERVAL_MINUTES, TimeUnit.MINUTES)
            .build(),
        )
    }

    fun refreshNow(context: Context) {
      WorkManager.getInstance(context)
        .enqueueUniqueWork(
          IMMEDIATE_WORK,
          ExistingWorkPolicy.REPLACE,
          OneTimeWorkRequestBuilder<WidgetRefreshWorker>().build(),
        )
    }

    fun cancel(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_WORK)
    }
  }
}

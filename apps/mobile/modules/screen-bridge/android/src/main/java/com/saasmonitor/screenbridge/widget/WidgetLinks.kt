package com.saasmonitor.screenbridge.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build

/**
 * Where a tap on a widget leads: the screen in the app (`{scheme}://screen/{key}`), the app itself
 * when it has no screen yet, or the configuration when the widget's screen was removed. The URL
 * scheme comes from the app's config (`plugins/withAndroidWidgets.ts` writes it in the manifest).
 */
internal class WidgetLinks(private val context: Context) {
  private val scheme: String? by lazy { readScheme() }

  fun screen(key: String): Intent {
    val scheme = scheme ?: return app()
    return Intent(Intent.ACTION_VIEW, Uri.parse("$scheme://screen/$key"))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  }

  fun app(): Intent =
    context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent(Intent.ACTION_MAIN).setPackage(context.packageName)

  fun configure(appWidgetId: Int): Intent =
    Intent(context, ConfigureWidgetActivity::class.java)
      .setAction(AppWidgetManager.ACTION_APPWIDGET_CONFIGURE)
      .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
      // One task per widget: configuring two widgets never reuses the other's screen.
      .setData(Uri.parse("saasmonitor-widget://configure/$appWidgetId"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

  private fun readScheme(): String? {
    val info =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.packageManager.getApplicationInfo(
          context.packageName,
          PackageManager.ApplicationInfoFlags.of(PackageManager.GET_META_DATA.toLong()),
        )
      } else {
        @Suppress("DEPRECATION")
        context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
      }
    return info.metaData?.getString(SCHEME_META_DATA)
  }

  companion object {
    const val SCHEME_META_DATA = "com.saasmonitor.screenbridge.URL_SCHEME"
  }
}

package com.saasmonitor.screenbridge.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.datastore.preferences.core.Preferences
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.PreviewSizeMode
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.provideContent
import androidx.glance.currentState
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.height
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.ScreenProblem
import com.saasmonitor.screenbridge.R

/**
 * A widget showing one screen of the app. Its state ([WidgetState]) is written by [WidgetUpdates];
 * this draws it, for the exact size the launcher gives.
 */
internal abstract class ScreenWidget : GlanceAppWidget() {
  override val sizeMode: SizeMode = SizeMode.Exact

  /** The size of the picker's preview, as the widget is first placed. */
  protected abstract val previewSize: DpSize

  override val previewSizeMode: PreviewSizeMode
    get() = SizeMode.Responsive(setOf(previewSize))

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val links = WidgetLinks(context)
    val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
    provideContent {
      val model = WidgetModel.from(currentState<Preferences>())
      val action =
        when {
          model.content == WidgetModel.Content.NoScreens -> actionStartActivity(links.app())
          model.content == WidgetModel.Content.ScreenRemoved || model.screenKey == null ->
            actionStartActivity(links.configure(appWidgetId))
          else -> actionStartActivity(links.screen(model.screenKey))
        }
      GlanceTheme { Widget(model, action) }
    }
  }

  /** The picker's preview on Android 15+ (`setWidgetPreviews`), drawn from sample numbers. */
  override suspend fun providePreview(context: Context, widgetCategory: Int) {
    val presentation = ScreenPresentation(SampleSnapshots.acme())
    provideContent {
      GlanceTheme {
        val settings = presentation.snapshot.settings
        val colors = widgetColors(settings.accent, settings.theme, WidgetPalette.SCREEN)
        WidgetFrame(colors, onClick = null, glow = true) {
          Ready(presentation, colors, updatedAgo = null, name = presentation.snapshot.screenName)
        }
      }
    }
  }

  @Composable
  private fun Widget(model: WidgetModel, action: Action) {
    val colors = widgetColors(model.accent, model.theme, model.palette)
    val ready = model.content as? WidgetModel.Content.Ready
    WidgetFrame(colors, action, glow = ready != null) {
      when (val content = model.content) {
        is WidgetModel.Content.Ready ->
          Ready(content.presentation, colors, content.updatedAgo, model.screenName)
        is WidgetModel.Content.Message ->
          Message(model.screenName, content.text, content.problem?.let { problemHint(it) }, colors)
        WidgetModel.Content.Loading -> Message(model.screenName, "—", null, colors)
        WidgetModel.Content.NoScreens ->
          Message(
            name = null,
            title = LocalContext.current.getString(R.string.sm_widget_no_screens),
            details = LocalContext.current.getString(R.string.sm_widget_no_screens_details),
            colors = colors,
          )
        WidgetModel.Content.ScreenRemoved ->
          Message(
            name = model.screenName,
            title = LocalContext.current.getString(R.string.sm_widget_screen_removed),
            details = LocalContext.current.getString(R.string.sm_widget_screen_removed_details),
            colors = colors,
          )
      }
    }
  }

  @Composable
  private fun Message(name: String?, title: String, details: String?, colors: WidgetColors) {
    Column {
      WidgetHeader(name ?: LocalContext.current.getString(R.string.sm_app_name), colors)
      Spacer(GlanceModifier.height(10.dp))
      WidgetMessage(title, details, colors)
    }
  }

  /** What to do about a locked or gone screen: the app's words, in English like the app. */
  @Composable
  private fun problemHint(problem: ScreenProblem): String =
    LocalContext.current.getString(
      when (problem) {
        ScreenProblem.LOCKED -> R.string.sm_widget_locked_details
        ScreenProblem.GONE -> R.string.sm_widget_gone_details
      }
    )

  /** The screen's numbers, laid out for this widget's size (`LocalSize`). */
  @Composable
  protected abstract fun Ready(
    presentation: ScreenPresentation,
    colors: WidgetColors,
    updatedAgo: String?,
    name: String?,
  )
}

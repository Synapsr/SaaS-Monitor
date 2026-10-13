package com.saasmonitor.screenbridge.widget

import android.net.Uri
import android.os.Build
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.saasmonitor.core.SharedScreen
import com.saasmonitor.core.display.Accents
import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.display.ScreenPresentation
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.core.state.Theme
import com.saasmonitor.screenbridge.R

/** A screen the widget may show, with its last known numbers when there are some. */
internal data class ScreenChoice(val screen: SharedScreen, val snapshot: ScreenSnapshot?)

internal data class ConfigureOptions(
  val screens: List<ScreenChoice>,
  val selectedKey: String?,
  val palette: WidgetPalette,
  /** Material You colors need Android 12. */
  val wallpaperColors: Boolean,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ConfigureWidgetScreen(
  options: ConfigureOptions?,
  onChoose: (SharedScreen, WidgetPalette) -> Unit,
  onOpenApp: () -> Unit,
) {
  Scaffold(topBar = { TopAppBar(title = { Text(stringResource(R.string.sm_configure_title)) }) }) {
    padding ->
    when {
      options == null ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
          CircularProgressIndicator()
        }
      options.screens.isEmpty() -> NoScreens(onOpenApp, Modifier.padding(padding))
      else -> ScreenList(options, onChoose, padding)
    }
  }
}

@Composable
private fun ScreenList(
  options: ConfigureOptions,
  onChoose: (SharedScreen, WidgetPalette) -> Unit,
  padding: PaddingValues,
) {
  var palette by remember { mutableStateOf(options.palette) }
  LazyColumn(contentPadding = padding, modifier = Modifier.fillMaxSize()) {
    item {
      Text(
        text = stringResource(R.string.sm_configure_details),
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
      )
    }
    if (options.wallpaperColors) {
      item { PalettePicker(palette, onChange = { palette = it }) }
    }
    items(options.screens, key = { it.screen.key }) { choice ->
      ScreenRow(choice, selected = choice.screen.key == options.selectedKey) {
        onChoose(choice.screen, palette)
      }
    }
  }
}

@Composable
private fun PalettePicker(palette: WidgetPalette, onChange: (WidgetPalette) -> Unit) {
  Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
    Text(
      text = stringResource(R.string.sm_configure_colors),
      style = MaterialTheme.typography.labelLarge,
      modifier = Modifier.padding(bottom = 8.dp),
    )
    val labels =
      mapOf(
        WidgetPalette.SCREEN to stringResource(R.string.sm_configure_colors_screen),
        WidgetPalette.SYSTEM to stringResource(R.string.sm_configure_colors_wallpaper),
      )
    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
      WidgetPalette.entries.forEachIndexed { index, option ->
        SegmentedButton(
          selected = palette == option,
          onClick = { onChange(option) },
          shape = SegmentedButtonDefaults.itemShape(index, WidgetPalette.entries.size),
        ) {
          Text(labels.getValue(option))
        }
      }
    }
  }
}

@Composable
private fun ScreenRow(choice: ScreenChoice, selected: Boolean, onClick: () -> Unit) {
  val snapshot = choice.snapshot
  val host = Uri.parse(choice.screen.baseUrl).host ?: choice.screen.baseUrl
  val summary =
    snapshot
      ?.takeIf { it.status == ScreenSnapshot.Status.READY }
      ?.let { ScreenPresentation(it) }
      ?.let { "${it.metricLabel} ${it.valueText} · $host" } ?: host
  val accent = Accents.palette(snapshot?.settings?.accent ?: "emerald", Theme.DARK).glow
  ListItem(
    headlineContent = { Text(choice.screen.name) },
    supportingContent = { Text(summary) },
    leadingContent = {
      Icon(
        painter = painterResource(R.drawable.sm_pulse),
        contentDescription = null,
        tint = Color(accent),
        modifier = Modifier.size(24.dp),
      )
    },
    trailingContent = { RadioButton(selected = selected, onClick = onClick) },
    modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
  )
}

@Composable
private fun NoScreens(onOpenApp: () -> Unit, modifier: Modifier = Modifier) {
  Column(
    modifier = modifier.fillMaxSize().padding(24.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically),
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Text(
      stringResource(R.string.sm_configure_empty_title),
      style = MaterialTheme.typography.titleMedium,
    )
    Text(
      stringResource(R.string.sm_configure_empty_details),
      style = MaterialTheme.typography.bodyMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Button(onClick = onOpenApp) { Text(stringResource(R.string.sm_configure_open_app)) }
  }
}

/** Material You where available, else the wall's near-black with its emerald. */
@Composable
internal fun ConfigureTheme(content: @Composable () -> Unit) {
  val dark = isSystemInDarkTheme()
  val context = LocalContext.current
  val emerald = Accents.palette("emerald", if (dark) Theme.DARK else Theme.LIGHT)
  val colorScheme =
    when {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
        if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      dark ->
        darkColorScheme(
          primary = Color(emerald.glow),
          background = Color(0xFF08090B),
          surface = Color(0xFF08090B),
        )
      else -> lightColorScheme(primary = Color(emerald.glow))
    }
  MaterialTheme(colorScheme = colorScheme, content = content)
}

@Preview
@Composable
private fun ConfigureWidgetScreenPreview() {
  val snapshot = SampleSnapshots.acme()
  ConfigureTheme {
    ConfigureWidgetScreen(
      options =
        ConfigureOptions(
          screens =
            listOf(
              ScreenChoice(
                SharedScreen("a1", "Acme Analytics", "https://saas-monitor.com", "t", null),
                snapshot,
              ),
              ScreenChoice(
                SharedScreen("b2", "Side project", "https://monitor.example.com", "u", null),
                null,
              ),
            ),
          selectedKey = "a1",
          palette = WidgetPalette.SCREEN,
          wallpaperColors = true,
        ),
      onChoose = { _, _ -> },
      onOpenApp = {},
    )
  }
}

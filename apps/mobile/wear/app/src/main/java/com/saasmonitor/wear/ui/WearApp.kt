package com.saasmonitor.wear.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController

/**
 * The watch app: the screens from the phone, then one screen's numbers. While it is in the
 * foreground it polls them like a wall display, and what just happened plays over everything.
 * [ambient]: the watch dozes with the app on screen.
 */
@Composable
fun WearApp(ambient: Boolean = false, viewModel: ScreensViewModel = viewModel()) {
  val items by viewModel.items.collectAsStateWithLifecycle()
  val moment by viewModel.moment.collectAsStateWithLifecycle()
  val lifecycle = LocalLifecycleOwner.current.lifecycle
  // Resumed and interactive only: polling stops in ambient mode, when the screen goes off or
  // the app leaves, and starts over from a new baseline when the watch wakes up.
  LaunchedEffect(lifecycle, ambient) {
    if (ambient) viewModel.clearMoments()
    else lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) { viewModel.poll() }
  }
  Box {
    WearTheme { Screens(items, viewModel) }
    MomentOverlay(moment, onDismiss = viewModel::dismissMoment)
  }
}

@Composable
private fun Screens(items: List<ScreenItem>?, viewModel: ScreensViewModel) {
  val navController = rememberSwipeDismissableNavController()
  AppScaffold {
    SwipeDismissableNavHost(navController = navController, startDestination = "screens") {
      composable("screens") {
        ScreenListScreen(items, onOpen = { key -> navController.navigate("screen/$key") })
      }
      composable("screen/{key}") { entry ->
        val key = entry.arguments?.getString("key")
        val item = items?.firstOrNull { it.screen.key == key } ?: return@composable
        ScreenDetailScreen(item = item, onFeature = { viewModel.feature(item.screen.key) })
      }
    }
  }
}

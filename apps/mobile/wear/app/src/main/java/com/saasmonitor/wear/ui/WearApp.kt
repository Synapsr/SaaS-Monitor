package com.saasmonitor.wear.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController

/** The watch app: the screens from the phone, then one screen's numbers. */
@Composable
fun WearApp(viewModel: ScreensViewModel = viewModel()) {
  val items by viewModel.items.collectAsStateWithLifecycle()
  val navController = rememberSwipeDismissableNavController()
  WearTheme {
    AppScaffold {
      SwipeDismissableNavHost(navController = navController, startDestination = "screens") {
        composable("screens") {
          ScreenListScreen(items, onOpen = { key -> navController.navigate("screen/$key") })
        }
        composable("screen/{key}") { entry ->
          val key = entry.arguments?.getString("key")
          val item = items?.firstOrNull { it.screen.key == key } ?: return@composable
          ScreenDetailScreen(
            item = item,
            onRefresh = { viewModel.refresh(item.screen.key) },
            onFeature = { viewModel.feature(item.screen.key) },
          )
        }
      }
    }
  }
}

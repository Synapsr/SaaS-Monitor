package com.saasmonitor.screenbridge

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Shares the app's screens with its home screen widgets and paired Wear OS watches. */
class ScreenBridgeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ScreenBridge")

    // TODO(android): store the screens for the widgets, update them, and sync them to Wear OS.
    AsyncFunction("setScreens") { screens: List<Map<String, Any?>> ->
    }

    AsyncFunction("reloadWidgets") {
    }
  }
}

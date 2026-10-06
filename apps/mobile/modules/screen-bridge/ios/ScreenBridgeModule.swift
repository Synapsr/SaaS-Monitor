import ExpoModulesCore
import WidgetKit

/// Shares the app's screens with its widgets (App Group) and its watch app (WatchConnectivity).
public class ScreenBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenBridge")

    OnCreate {
      WatchLink.shared.activate()
    }

    AsyncFunction("setScreens") { (screens: [SharedScreenRecord]) throws in
      try SharedScreens.save(screens.map(\.screen))
      WidgetCenter.shared.reloadAllTimelines()
      WatchLink.shared.sendScreens()
    }

    AsyncFunction("reloadWidgets") {
      WidgetCenter.shared.reloadAllTimelines()
      WatchLink.shared.refreshComplications()
    }

    AsyncFunction("setNotificationAudio") { (enabled: Bool) in
      SharedScreens.setNotificationAudio(enabled)
    }
  }
}

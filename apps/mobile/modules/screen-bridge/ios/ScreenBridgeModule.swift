import ExpoModulesCore

/// Shares the app's screens with its widgets (App Group) and its watch app (WatchConnectivity).
public class ScreenBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenBridge")

    // TODO(apple): write the screens to the App Group, reload WidgetKit timelines, and send them
    // to the paired watch.
    AsyncFunction("setScreens") { (screens: [[String: Any?]]) in
    }

    AsyncFunction("reloadWidgets") {
    }
  }
}

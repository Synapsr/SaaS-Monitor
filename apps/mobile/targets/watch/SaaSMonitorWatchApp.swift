import SwiftUI

@main
struct SaaSMonitorWatchApp: App {
  @State private var screens = WatchScreens()

  var body: some Scene {
    WindowGroup {
      ScreenListView()
        .environment(screens)
    }
  }
}

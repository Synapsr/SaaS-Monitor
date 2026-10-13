import SwiftUI

/// SaaS Monitor for Mac: a screen in the notch, and its moments as they happen. It lives in the
/// menu bar, without a Dock icon.
@main
struct SaaSMonitorApp: App {
  @NSApplicationDelegateAdaptor private var app: AppDelegate

  var body: some Scene {
    MenuBarExtra {
      MenuBarMenu(app: app)
    } label: {
      Image(nsImage: .menuBarPulse)
    }
  }
}

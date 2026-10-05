import Foundation
import WatchConnectivity
import WidgetKit

/// Receives what the iPhone app sends (`modules/screen-bridge/ios`): its screens, as the
/// application context `["screens": Data]` (JSON of `[SharedScreen]`), and requests to refresh
/// complications, as the user info `["reload": true]`.
final class PhoneLink: NSObject, WCSessionDelegate {
  private let onScreens: @Sendable ([SharedScreen]) -> Void

  init(onScreens: @escaping @Sendable ([SharedScreen]) -> Void) {
    self.onScreens = onScreens
  }

  func activate() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: (any Error)?) {
    // The last context the iPhone sent while this app wasn't running.
    if state == .activated { receive(session.receivedApplicationContext) }
  }

  func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
    receive(context)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
    if userInfo["reload"] as? Bool == true { WidgetCenter.shared.reloadAllTimelines() }
  }

  private func receive(_ context: [String: Any]) {
    guard let data = context["screens"] as? Data,
      let screens = try? JSONDecoder().decode([SharedScreen].self, from: data)
    else { return }
    ScreenStore.save(screens)
    WidgetCenter.shared.reloadAllTimelines()
    // Faces list one complication per screen.
    WidgetCenter.shared.invalidateConfigurationRecommendations()
    onScreens(screens)
  }
}

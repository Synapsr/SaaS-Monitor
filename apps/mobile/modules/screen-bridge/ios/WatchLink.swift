import WatchConnectivity

/// Hands the screens to the paired Apple Watch, whose app keeps them for its complications
/// (`targets/watch/PhoneLink.swift`). The application context carries the latest screens only, and
/// reaches the watch app even when it isn't running.
final class WatchLink: NSObject, WCSessionDelegate, Sendable {
  static let shared = WatchLink()

  func activate() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    if session.activationState != .activated { session.activate() }
  }

  /// Sends the screens of the App Group, once the session is active: `activate()` sends them then.
  func sendScreens() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled,
      let screens = SharedScreens.data()
    else { return }
    // Fails only without a watch app to receive it, which was just checked.
    try? session.updateApplicationContext(["screens": screens])
  }

  /// Asks the watch to refresh its complications, within the few wake-ups a day watchOS grants.
  func refreshComplications() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated, session.isComplicationEnabled,
      session.remainingComplicationUserInfoTransfers > 0
    else { return }
    session.transferCurrentComplicationUserInfo(["reload": true])
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: (any Error)?) {
    sendScreens()
  }

  /// The watch app was installed, or another watch paired.
  func sessionWatchStateDidChange(_ session: WCSession) {
    sendScreens()
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  /// The user switched to another watch: the session starts over with it.
  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }
}

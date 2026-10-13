import Foundation

/// A screen of the app, as `ScreenBridge.setScreens` hands it over (`SharedScreen` in
/// `modules/screen-bridge/src`): enough for a widget or the watch to fetch the screen's state.
struct SharedScreen: Codable, Hashable, Identifiable, Sendable {
  /// Stable and opaque: the first 16 hex characters of the SHA-256 of `token`.
  let key: String
  let name: String
  /// Origin of the SaaS Monitor instance, without trailing slash: `https://saas-monitor.com`.
  let baseUrl: String
  let token: String
  /// Proof of the screen's password, sent as `X-Screen-Access`; `nil` for a screen without.
  let accessProof: String?

  var id: String { key }

  /// Opens the screen in the iPhone app.
  var deepLink: URL? { URL(string: "saasmonitor://screen/\(key)") }
}

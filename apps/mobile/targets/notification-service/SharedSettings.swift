import Foundation

/// What the app shares with its extension through the App Group: its screens, and whether
/// notifications play their moment's sound and voice. The screen bridge
/// (`modules/screen-bridge/ios/SharedScreens.swift`) writes both.
enum SharedSettings {
  /// `APP_GROUP` in `app.config.ts`.
  static let appGroup = "group.com.saasmonitor.app"

  static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }

  static var container: URL? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
  }

  /// The app's Settings: "Play sounds and voices", and "Also when the phone is locked".
  static var playsNotificationAudio: Bool {
    defaults?.bool(forKey: "notificationAudio") ?? false
  }

  static func screen(key: String) -> SharedScreen? {
    guard let data = defaults?.data(forKey: "screens"),
      let screens = try? JSONDecoder().decode([SharedScreen].self, from: data)
    else { return nil }
    return screens.first { $0.key == key }
  }
}

/// A screen of the app, as the screen bridge shares it: enough to reach its instance.
struct SharedScreen: Decodable, Sendable {
  let key: String
  /// Origin (and path) of its instance, without trailing slash.
  let baseUrl: String
  let token: String
  /// Proof of the screen's password, sent as `X-Screen-Access`.
  let accessProof: String?

  func url(_ path: String) -> URL? { URL(string: baseUrl + path) }

  var announcementURL: URL? {
    var allowed = CharacterSet.alphanumerics
    allowed.insert(charactersIn: "-._~")
    guard let token = token.addingPercentEncoding(withAllowedCharacters: allowed) else { return nil }
    return url("/api/screens/\(token)/announcement")
  }
}

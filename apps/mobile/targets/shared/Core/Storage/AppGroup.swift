import Foundation

/// What the iPhone app, its widgets and the watch app share: on the iPhone, and on the watch
/// between the watch app and its complications. `APP_GROUP` in `app.config.ts`.
enum AppGroup {
  static let identifier = "group.com.saasmonitor.app"

  /// Key of the screens, as JSON (`[SharedScreen]`). The screen bridge writes the same.
  static let screensKey = "screens"

  static var defaults: UserDefaults? { UserDefaults(suiteName: identifier) }

  static var container: URL? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: identifier)
  }
}

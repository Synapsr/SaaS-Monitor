import Foundation

/// The Mac app's stand-in for the App Group the iPhone app shares with its widgets and watch: it
/// keeps the same things in its own sandbox, its screens in its defaults and their last states in
/// its Application Support.
enum AppGroup {
  /// Key of the screens, as JSON (`[SharedScreen]`), like on the iPhone.
  static let screensKey = "screens"

  static var defaults: UserDefaults? { .standard }

  /// The sandbox's home folder, which holds `Library/Application Support` as a group container
  /// does.
  static var container: URL? { URL.homeDirectory }
}

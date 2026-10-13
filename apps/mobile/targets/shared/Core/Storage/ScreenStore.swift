import Foundation

/// The screens of the app, in the App Group. The iPhone app writes them (`ScreenBridge`); on the
/// watch, the watch app does, as the iPhone sends them.
enum ScreenStore {
  static func screens() -> [SharedScreen] {
    guard let data = AppGroup.defaults?.data(forKey: AppGroup.screensKey) else { return [] }
    return (try? JSONDecoder().decode([SharedScreen].self, from: data)) ?? []
  }

  /// The screen of `key`, or the first one when it is gone (or none was chosen).
  static func screen(key: String?) -> SharedScreen? {
    let screens = screens()
    return screens.first { $0.key == key } ?? screens.first
  }

  static func save(_ screens: [SharedScreen]) {
    guard let data = try? JSONEncoder().encode(screens) else { return }
    AppGroup.defaults?.set(data, forKey: AppGroup.screensKey)
    StateCache.keep(only: Set(screens.map(\.key)))
  }
}

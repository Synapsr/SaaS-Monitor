import Foundation

/// The screens in the App Group, where the widgets read them. `targets/shared/Core/Storage`
/// reads the same group and key.
enum SharedScreens {
  /// `APP_GROUP` in `app.config.ts`.
  static let appGroup = "group.com.saasmonitor.app"
  /// JSON of `[SharedScreen]`.
  static let key = "screens"
  /// Whether notifications play their moment's sound and voice: the notification service
  /// extension (`targets/notification-service`) reads it.
  static let notificationAudioKey = "notificationAudio"

  static func save(_ screens: [SharedScreen]) throws {
    let data = try JSONEncoder().encode(screens)
    UserDefaults(suiteName: appGroup)?.set(data, forKey: key)
  }

  static func data() -> Data? {
    UserDefaults(suiteName: appGroup)?.data(forKey: key)
  }

  static func setNotificationAudio(_ enabled: Bool) {
    UserDefaults(suiteName: appGroup)?.set(enabled, forKey: notificationAudioKey)
  }
}

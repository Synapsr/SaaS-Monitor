import UserNotifications

/// Gives the notification of a moment its screen's sound and voice, as the screen's wall display
/// plays them, when the device asks for it (the app's Settings, "Also when the phone is locked").
/// Anything that fails, or takes too long, leaves the notification its usual sound.
final class NotificationService: UNNotificationServiceExtension, @unchecked Sendable {
  private let lock = NSLock()
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var content: UNMutableNotificationContent?
  private var task: Task<Void, Never>?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    guard
      SharedSettings.playsNotificationAudio,
      let content = request.content.mutableCopy() as? UNMutableNotificationContent,
      let moment = NotificationMoment(userInfo: request.content.userInfo),
      let screen = SharedSettings.screen(key: moment.screen)
    else {
      contentHandler(request.content)
      return
    }
    lock.withLock {
      self.contentHandler = contentHandler
      self.content = content
    }
    task = Task {
      let sound = await MomentSound.make(moment.audio, of: screen)
      self.deliver(sound: sound.map { UNNotificationSound(named: $0) } ?? .default)
    }
  }

  override func serviceExtensionTimeWillExpire() {
    task?.cancel()
    deliver(sound: .default)
  }

  /// Delivers the notification once, with `sound`.
  private func deliver(sound: UNNotificationSound) {
    let delivery: (((UNNotificationContent) -> Void), UNMutableNotificationContent)? = lock.withLock {
      guard let contentHandler, let content else { return nil }
      self.contentHandler = nil
      content.sound = sound
      return (contentHandler, content)
    }
    if case let (contentHandler, content)? = delivery { contentHandler(content) }
  }
}

import Foundation

/// The last state fetched for each screen, so that a widget, a complication or the watch app shows
/// the last known numbers when the instance can't be reached.
enum StateCache {
  struct Entry: Codable, Sendable {
    let state: DisplayState
    let fetchedAt: Date
  }

  /// More than any widget or the watch shows: the rest of the feed isn't worth keeping.
  private static let feedLength = 8

  static func load(key: String) -> Entry? {
    guard let url = file(key: key), let data = try? Data(contentsOf: url) else { return nil }
    return try? ScreenJSON.decoder().decode(Entry.self, from: data)
  }

  static func save(_ state: DisplayState, fetchedAt: Date, key: String) {
    guard let url = file(key: key) else { return }
    let entry = Entry(state: state.keepingFeed(feedLength), fetchedAt: fetchedAt)
    guard let data = try? ScreenJSON.encoder().encode(entry) else { return }
    // Readable while the iPhone is locked: CarPlay and StandBy refresh widgets then.
    try? data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
  }

  /// Forgets the screens that were removed from the app.
  static func keep(only keys: Set<String>) {
    guard let folder = folder(),
      let files = try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
    else { return }
    for file in files where !keys.contains(file.deletingPathExtension().lastPathComponent) {
      try? FileManager.default.removeItem(at: file)
    }
  }

  private static func folder() -> URL? {
    guard let container = AppGroup.container else { return nil }
    let folder = container.appending(path: "Library/Application Support/ScreenStates", directoryHint: .isDirectory)
    try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    return folder
  }

  private static func file(key: String) -> URL? {
    // Keys are hex, but a file name must never be a path.
    guard !key.isEmpty, key.allSatisfy(\.isHexDigit) else { return nil }
    return folder()?.appending(path: "\(key).json")
  }
}

private extension DisplayState {
  func keepingFeed(_ length: Int) -> DisplayState {
    DisplayState(
      generatedAt: generatedAt,
      screen: screen,
      currency: currency,
      status: status,
      accounts: accounts,
      metrics: metrics,
      series: series,
      feed: Array(feed.prefix(length)),
      testEvent: testEvent,
      personalizedVoice: personalizedVoice
    )
  }
}

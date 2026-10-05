import Foundation

/// What a widget, a complication or the watch app shows of a screen: its latest state, or the
/// last one known when the instance can't be reached.
struct ScreenSnapshot: Sendable {
  let state: DisplayState?
  /// When `state` was fetched.
  let fetchedAt: Date?
  let problem: Problem?

  enum Problem: Sendable {
    /// The screen asks for its password: the app knows how to ask for it.
    case locked
    /// The screen's link no longer works.
    case gone
    /// The instance can't be reached right now: `state` is the last one known, if any.
    case offline
  }

  /// Numbers older than this get a discreet timestamp.
  static let freshness: TimeInterval = 30 * 60

  /// Whether the numbers shown at `date` may be outdated, and say since when.
  func isStale(at date: Date) -> Bool {
    guard let fetchedAt else { return false }
    return problem == .offline || date.timeIntervalSince(fetchedAt) > Self.freshness
  }
}

/// Fetches screens, keeping their last state for when the instance can't be reached.
struct ScreenLoader: Sendable {
  var client = ScreenClient()

  func load(_ screen: SharedScreen) async -> ScreenSnapshot {
    do {
      let state = try await client.state(of: screen)
      let now = Date.now
      StateCache.save(state, fetchedAt: now, key: screen.key)
      return ScreenSnapshot(state: state, fetchedAt: now, problem: nil)
    } catch {
      // The last state still names the screen and speaks its language.
      let last = StateCache.load(key: screen.key)
      return ScreenSnapshot(state: last?.state, fetchedAt: last?.fetchedAt, problem: Self.problem(error))
    }
  }

  private static func problem(_ error: ScreenFetchError) -> ScreenSnapshot.Problem {
    switch error {
    case .locked: .locked
    case .gone: .gone
    case .unavailable: .offline
    }
  }

  /// The last state known, without asking the instance: for a first paint.
  func cached(_ screen: SharedScreen) -> ScreenSnapshot? {
    StateCache.load(key: screen.key).map {
      ScreenSnapshot(state: $0.state, fetchedAt: $0.fetchedAt, problem: nil)
    }
  }
}

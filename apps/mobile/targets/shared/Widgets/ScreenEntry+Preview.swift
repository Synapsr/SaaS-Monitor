import Foundation

/// Entries for Xcode previews.
extension ScreenEntry {
  /// `state` as just fetched; or, `stale`, the last state known three hours ago when the instance
  /// can't be reached.
  static func preview(_ state: DisplayState, stale: Bool = false, problem: ScreenSnapshot.Problem? = nil) -> ScreenEntry {
    let now = Date.now
    return ScreenEntry(
      date: now,
      screen: .sample,
      snapshot: ScreenSnapshot(
        state: state,
        fetchedAt: stale ? now.addingTimeInterval(-3 * 3600) : now,
        problem: stale ? .offline : problem
      )
    )
  }
}

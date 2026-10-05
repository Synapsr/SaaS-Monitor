import Foundation
import WidgetKit

/// A screen as a widget shows it at `date`.
struct ScreenEntry: TimelineEntry {
  let date: Date
  /// `nil` until the app shares a screen.
  let screen: SharedScreen?
  let content: ScreenContent
  /// When the numbers were fetched.
  let fetchedAt: Date?
  /// Whether the numbers may be outdated at `date`: they then show when they are from.
  let isStale: Bool
  /// The instance couldn't be reached: the numbers are the last known.
  let isOffline: Bool

  init(date: Date, screen: SharedScreen, snapshot: ScreenSnapshot) {
    self.date = date
    self.screen = screen
    content = ScreenContent(snapshot)
    fetchedAt = snapshot.fetchedAt
    isStale = snapshot.isStale(at: date)
    isOffline = snapshot.problem == .offline
  }

  private init(date: Date) {
    self.date = date
    screen = nil
    content = .message("Add a screen in the SaaS Monitor app.", figures: nil)
    fetchedAt = nil
    isStale = false
    isOffline = false
  }

  /// No screen yet: the app is where they come from.
  static func noScreen(at date: Date) -> ScreenEntry { ScreenEntry(date: date) }

  /// Placeholders and the widget gallery, before any screen is shared.
  static func sample(at date: Date = .now) -> ScreenEntry {
    let state = DisplayState.sample(now: date)
    return ScreenEntry(
      date: date,
      screen: .sample,
      snapshot: ScreenSnapshot(state: state, fetchedAt: date, problem: nil)
    )
  }

  /// Opens the screen in the app, or the app itself.
  var url: URL? { screen?.deepLink ?? URL(string: "saasmonitor://") }
}

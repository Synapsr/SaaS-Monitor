import Foundation
import Observation

/// Follows every screen of the library as its walls do, fetching its state every 10 seconds, and
/// finds the moments each new state brings.
@MainActor
@Observable
final class ScreenMonitor {
  /// The latest of each screen, by key.
  private(set) var snapshots: [String: ScreenSnapshot] = [:]

  /// What each new state brings: its moments, the state, and its screen.
  @ObservationIgnored var onMoments: (([Moment], DisplayState, SharedScreen) -> Void)?
  /// A screen's first state since the app opened, or since it was added.
  @ObservationIgnored var onFirstState: ((DisplayState, SharedScreen) -> Void)?

  @ObservationIgnored private let library: ScreenLibrary
  @ObservationIgnored private let loader = ScreenLoader()
  @ObservationIgnored private var trackers: [String: MomentTracker] = [:]
  @ObservationIgnored private var polling: Task<Void, Never>?

  /// As often as wall displays ask.
  static let interval: Duration = .seconds(10)

  init(library: ScreenLibrary) {
    self.library = library
    for screen in library.screens {
      snapshots[screen.key] = loader.cached(screen)
    }
  }

  func snapshot(of screen: SharedScreen?) -> ScreenSnapshot? {
    screen.flatMap { snapshots[$0.key] }
  }

  /// Polls until `pause()`: at once, then every `interval`.
  func resume() {
    guard polling == nil else { return }
    polling = Task { [weak self] in
      while !Task.isCancelled {
        await self?.refresh()
        try? await Task.sleep(for: Self.interval)
      }
    }
  }

  /// While the Mac sleeps: what happens meanwhile is caught up with on waking, as a summary.
  func pause() {
    polling?.cancel()
    polling = nil
  }

  /// Fetches every screen now, e.g. one just added.
  func refresh() async {
    let screens = library.screens
    let loader = loader
    await withTaskGroup(of: (SharedScreen, ScreenSnapshot).self) { group in
      for screen in screens {
        group.addTask { (screen, await loader.load(screen)) }
      }
      for await (screen, snapshot) in group {
        apply(snapshot, of: screen)
      }
    }
    forgetRemovedScreens()
  }

  private func apply(_ snapshot: ScreenSnapshot, of screen: SharedScreen) {
    // Removed while it was fetched.
    guard library.screens.contains(where: { $0.key == screen.key }) else { return }
    snapshots[screen.key] = snapshot
    // The last known state of an unreachable screen brings nothing new.
    guard let state = snapshot.state, snapshot.problem == nil else { return }
    library.rename(screen.key, to: state.screen.name)

    if trackers[screen.key] == nil { onFirstState?(state, screen) }
    var tracker = trackers[screen.key] ?? MomentTracker()
    let moments = tracker.track(state)
    trackers[screen.key] = tracker
    if !moments.isEmpty { onMoments?(moments, state, screen) }
  }

  private func forgetRemovedScreens() {
    let keys = Set(library.screens.map(\.key))
    snapshots = snapshots.filter { keys.contains($0.key) }
    trackers = trackers.filter { keys.contains($0.key) }
  }
}

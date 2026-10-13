import Observation
import WatchKit

/// Plays a screen's moments one after the other while the app is open, as a wall display does:
/// each card for a few seconds, with a haptic.
@MainActor
@Observable
final class MomentPresenter {
  private(set) var current: MomentCard?
  @ObservationIgnored private var queue: [MomentCard] = []
  @ObservationIgnored private var tracker = MomentTracker()
  @ObservationIgnored private var playing: Task<Void, Never>?
  @ObservationIgnored private var waiting: Task<Void, Never>?
  /// The screen's `momentSeconds`.
  @ObservationIgnored private var seconds = 10

  /// A glance is enough on a wrist: shorter than the wall's moments.
  private static let longest: Double = 6
  /// However many moments wait, each stays long enough to be read.
  private static let shortest: Double = 3.5

  /// Plays what `state`, just fetched, brings since the previous one.
  func track(_ state: DisplayState) {
    let cards = tracker.track(state).map { MomentCard($0, state: state) }
    seconds = state.screen.settings.momentSeconds
    guard !cards.isEmpty else { return }
    queue += cards
    if playing == nil { playing = Task { await play() } }
  }

  /// Moves on to the next moment, if any.
  func skip() {
    waiting?.cancel()
  }

  /// Drops the moments still waiting, e.g. when the card is dismissed.
  func clear() {
    queue.removeAll()
    waiting?.cancel()
  }

  private func play() async {
    while !queue.isEmpty {
      let card = queue.removeFirst()
      current = card
      // Losses are said softly.
      WKInterfaceDevice.current().play(card.isCelebration ? .success : .click)
      let duration = queue.isEmpty ? min(Double(seconds), Self.longest) : Self.shortest
      let waiting = Task { _ = try? await Task.sleep(for: .seconds(duration)) }
      self.waiting = waiting
      await waiting.value
    }
    current = nil
    playing = nil
  }
}

import Foundation
import Observation
import os

/// A moment on its way to the notch: its card, in its screen's language and colors, and what it
/// plays.
struct StagedMoment: Identifiable, Sendable {
  let card: MomentCard
  let screen: SharedScreen
  let audio: MomentAudio?
  let celebration: Celebration?
  /// How long it stays when nothing waits behind it: the screen's `momentSeconds`, shortened.
  let seconds: Double

  var id: String { card.id }
}

/// Confetti for money coming in, a bigger show for milestones, nothing for losses, nor for money
/// that only passes through for a Stripe Connect account (`momentCelebration` on the web).
enum Celebration: Sendable {
  case payment, milestone

  init?(_ moment: Moment) {
    switch moment {
    case .milestone: self = .milestone
    case .payment(let item): if item.connect == nil { self = .payment } else { return nil }
    case .test: self = .payment
    case .summary(let summary): if summary.revenue > 0 { self = .payment } else { return nil }
    case .movement, .customer: return nil
    }
  }
}

/// Shows the moments of every screen one after the other, as a wall does, each for a few seconds.
@MainActor
@Observable
final class MomentStage {
  private(set) var current: StagedMoment?
  /// While the notch is open, the moment on stage waits for it to close.
  var isHeld = false

  /// Plays what a moment plays, as it comes on stage.
  @ObservationIgnored var onStage: ((StagedMoment) -> Void)?

  @ObservationIgnored private var queue: [StagedMoment] = []
  /// Moments shown lately, by id: two screens showing the same account report the same things.
  @ObservationIgnored private var recent: [String: Date] = [:]
  @ObservationIgnored private var playing: Task<Void, Never>?

  /// A glance is enough beside the notch: shorter than the wall's moments.
  static let longest: Double = 6
  /// However many moments wait, each stays long enough to be read.
  static let shortest: Double = 3.5
  /// A moment reported again after this long is news again.
  static let memory: TimeInterval = 10 * 60

  private static let log = Logger(subsystem: "com.saasmonitor.mac", category: "moments")

  func enqueue(_ moments: [Moment], state: DisplayState, screen: SharedScreen) {
    let now = Date.now
    recent = recent.filter { now.timeIntervalSince($0.value) < Self.memory }
    let settings = state.screen.settings
    for moment in moments where recent[moment.id] == nil {
      recent[moment.id] = now
      queue.append(
        StagedMoment(
          card: MomentCard(moment, state: state),
          screen: screen,
          audio: MomentAudio(moment, settings: settings, personalizedVoice: state.personalizedVoice ?? false),
          celebration: Celebration(moment),
          seconds: min(Double(settings.momentSeconds), Self.longest)
        ))
    }
    if playing == nil, !queue.isEmpty { playing = Task { await play() } }
  }

  /// Moves on to the next moment, if any.
  func skip() {
    remaining = 0
  }

  /// Drops the moments of a screen removed from the app.
  func forget(screen key: String) {
    queue.removeAll { $0.screen.key == key }
    if current?.screen.key == key { skip() }
  }

  @ObservationIgnored private var remaining: Double = 0

  private func play() async {
    while !queue.isEmpty {
      let moment = queue.removeFirst()
      current = moment
      Self.log.info("On stage: \(moment.id, privacy: .public) of \(moment.screen.key, privacy: .public)")
      onStage?(moment)
      remaining = queue.isEmpty ? moment.seconds : Self.shortest
      // Counts down only while it shows: the notch may open meanwhile.
      while remaining > 0 {
        try? await Task.sleep(for: .milliseconds(100))
        if !isHeld { remaining -= 0.1 }
      }
    }
    current = nil
    playing = nil
  }
}

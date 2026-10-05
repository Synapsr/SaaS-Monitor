import Foundation

/// What the watch remembers between two states of a screen to find what just happened
/// (`trackMoments` in `src/lib/display/moments.ts`). The first state only sets the baseline: the
/// watch never replays what happened before it was opened.
struct MomentTracker {
  private var previous: DisplayState?
  /// Feed items already known; `nil` until the first state.
  private var seen: Set<String>?
  private var testEventId: String?
  /// Milestones already celebrated, so a value hovering around one celebrates it once.
  private var celebrated: Set<String> = []
  /// First payments waiting for the subscription they may start (see `awaitsSubscription`).
  private var held: [FeedItem] = []

  /// Enough to recognize every item a feed can show.
  private static let memorySize = 500

  /// The moments `state` brings since the previous one, in the order they happened.
  mutating func track(_ state: DisplayState) -> [Moment] {
    let comparable = previous.map { Self.areComparable($0, state) } ?? false
    let fresh = comparable ? freshItems(in: state.feed) : []
    remember(state.feed, reset: !comparable)

    let settings = state.screen.settings
    let shown = fresh.filter { settings.showsMoment(ScreenEvent($0)) }
    // Payments held by the previous state play now, after their subscription if it came.
    let candidates = comparable ? held + shown : shown
    let nowHeld = shown.filter { item in
      Self.awaitsSubscription(item)
        && !candidates.contains { $0.isMrrIncrease && MomentPlanner.startedBy($0, payment: item) }
    }
    let heldIds = Set(nowHeld.map(\.id))
    var moments = MomentPlanner.plan(candidates.filter { !heldIds.contains($0.id) })

    if comparable, let previous, Self.haveSameMetricAndGoal(previous, state), settings.showsMoment(.milestone),
      let amount = GoalProgress.crossedMilestone(
        from: settings.metric.fromMrr(previous.metrics.mrr),
        to: settings.metric.fromMrr(state.metrics.mrr),
        goal: settings.goal,
        currency: state.currency
      )
    {
      let isGoal = settings.goal.map { Money.minorUnits(Decimal($0), currency: state.currency) == amount } ?? false
      let milestone = Moment.milestone(amount: amount, metric: settings.metric, isGoal: isGoal)
      if celebrated.insert(milestone.id).inserted { moments.append(milestone) }
    }

    let testId = state.testEvent?.id
    if previous != nil, let testId, testId != testEventId { moments.append(.test(id: testId)) }

    previous = state
    testEventId = testId
    held = nowHeld
    return moments
  }

  /// Live items not seen yet, oldest first. Items imported from history are never fresh.
  private func freshItems(in feed: [FeedItem]) -> [FeedItem] {
    guard let seen else { return [] }
    return feed.filter { $0.live && !seen.contains($0.id) }.sorted { $0.occurredAt < $1.occurredAt }
  }

  private mutating func remember(_ feed: [FeedItem], reset: Bool) {
    var remembered = reset ? Set<String>() : (seen ?? [])
    remembered.formUnion(feed.map(\.id))
    // The current feed is what must stay known; older ids may go.
    if remembered.count > Self.memorySize { remembered = Set(feed.map(\.id)) }
    seen = remembered
  }

  /// A state after an import, a currency change or a change of the screen's accounts is a new
  /// baseline: none of what it brings just happened.
  private static func areComparable(_ a: DisplayState, _ b: DisplayState) -> Bool {
    a.status == .ready && b.status == .ready && a.currency == b.currency
      && Set(a.accounts.map(\.id)) == Set(b.accounts.map(\.id))
  }

  /// Switching from MRR to ARR, or to a new goal, isn't progress: milestones start over.
  private static func haveSameMetricAndGoal(_ a: DisplayState, _ b: DisplayState) -> Bool {
    a.screen.settings.metric == b.screen.settings.metric && a.screen.settings.goal == b.screen.settings.goal
  }

  /// The first payment of a customer without a subscription may start one a few seconds later:
  /// it waits for the next state, to be announced after its subscription.
  private static func awaitsSubscription(_ item: FeedItem) -> Bool {
    item.kind == .payment && item.connect == nil && item.customerKey != nil && item.customerSubscribed == false
  }
}

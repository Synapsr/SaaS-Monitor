package com.saasmonitor.core.moments

import com.saasmonitor.core.display.Money
import com.saasmonitor.core.display.crossedMilestone
import com.saasmonitor.core.state.FeedEntry
import com.saasmonitor.core.state.FeedKind
import com.saasmonitor.core.state.ScreenEvent
import com.saasmonitor.core.state.ScreenSnapshot
import kotlin.math.abs

/**
 * What a screen remembers between two states to tell what just happened, like `trackMoments` of the
 * web display (`src/lib/display/moments.ts`). Immutable: [track] returns the next tracker.
 */
data class MomentTracker(
  val previous: ScreenSnapshot? = null,
  /** Feed ids already shown, oldest first; `null` until a first state set the baseline. */
  val seen: Set<String>? = null,
  val testEventId: String? = null,
  /** Milestones already celebrated: a value hovering around one celebrates it once. */
  val celebrated: Set<String> = emptySet(),
  /** First payments waiting for the subscription they may start, a poll later. */
  val held: List<FeedEntry> = emptyList(),
) {
  /**
   * Compares [state] with the previous one. The first state, and any state after an import, a
   * currency change or a change of the screen's accounts, only sets the baseline: moments come from
   * what happens next, never from what was there when the screen opened. Events the screen doesn't
   * show as moments (`settings.events[event].moment`) are left out.
   */
  fun track(state: ScreenSnapshot): Pair<MomentTracker, List<Moment>> {
    val previous = previous
    val comparable =
      previous != null &&
        previous.status == ScreenSnapshot.Status.READY &&
        state.status == ScreenSnapshot.Status.READY &&
        previous.currency == state.currency &&
        previous.accounts.map { it.id }.toSet() == state.accounts.map { it.id }.toSet()

    val shown = state.settings.momentEvents
    val (fresh, seen) = diffFeed(if (comparable) seen else null, state.feed)
    val played = fresh.filter { it.event in shown }
    // Payments held by the previous state play now, after their subscription if it came.
    val candidates = if (comparable) held + played else played
    val held = played.filter { item ->
      item.awaitsSubscription && candidates.none { it.isMrrIncrease && startedBy(it, item) }
    }
    val moments = planMoments(candidates.filter { it !in held }).toMutableList()

    var celebrated = celebrated
    if (
      comparable &&
        previous!!.settings.metric == state.settings.metric &&
        previous.settings.goal == state.settings.goal &&
        ScreenEvent.MILESTONE in shown
    ) {
      val milestone = crossedMilestone(previous, state)
      if (milestone != null && milestone.id !in celebrated) {
        celebrated = celebrated + milestone.id
        moments += milestone
      }
    }

    val testEventId = state.testEventId
    if (previous != null && testEventId != null && testEventId != this.testEventId) {
      moments += Moment.Test(testEventId)
    }
    return MomentTracker(state, seen, testEventId, celebrated, held) to moments
  }

  private fun crossedMilestone(previous: ScreenSnapshot, state: ScreenSnapshot): Moment? {
    val metric = state.settings.metric
    val goal = state.settings.goal
    val amount =
      crossedMilestone(
        before = metric.fromMrr(previous.mrr),
        after = metric.fromMrr(state.mrr),
        goal = goal,
        currency = state.currency,
      ) ?: return null
    val isGoal = goal != null && amount == Money.toMinorUnits(goal.toDouble(), state.currency)
    return Moment.Milestone(amount, metric, isGoal)
  }

  companion object {
    /** Enough to recognize every item a feed shows, without growing for days. */
    private const val MEMORY_SIZE = 500

    /**
     * The live items a screen has not shown yet, oldest first, and the ids to remember. On a first
     * state (`seen` is `null`) nothing is fresh: history is never replayed.
     */
    internal fun diffFeed(
      seen: Set<String>?,
      feed: List<FeedEntry>,
    ): Pair<List<FeedEntry>, Set<String>> {
      val fresh =
        if (seen == null) emptyList()
        else feed.filter { it.live && it.id !in seen }.sortedBy { it.occurredAt }
      val remembered = LinkedHashSet(seen.orEmpty())
      for (item in feed) {
        remembered.remove(item.id)
        remembered.add(item.id)
      }
      return fresh to remembered.toList().takeLast(MEMORY_SIZE).toCollection(LinkedHashSet())
    }
  }
}

/** From this many moments of an account at once, celebrate once with a summary. */
private const val BURST_SIZE = 4

/** A payment, a subscription change and a new customer this close go together (Checkout). */
private const val SAME_CHECKOUT_MILLIS = 10 * 60_000L

/** Moments played one after the other, as early as the first thing they announce happened. */
private class MomentGroup(val moments: List<Moment>, val at: Long)

/**
 * Turns fresh items (oldest first) into moments, in the order things happened. Each account is
 * planned on its own: a burst of one never swallows what another did.
 */
internal fun planMoments(fresh: List<FeedEntry>): List<Moment> =
  fresh
    .groupBy { it.accountId }
    .values
    .flatMap(::planAccountMoments)
    .sortedBy { it.at }
    .flatMap { it.moments }

/**
 * The moments of one account. A new subscription usually comes with its first payment and its
 * customer's creation: the subscription is announced, then the payment that started it, while the
 * customer's creation goes without saying.
 */
private fun planAccountMoments(items: List<FeedEntry>): List<MomentGroup> {
  val payments = items.filter { it.kind == FeedKind.PAYMENT }
  val customers = items.filter { it.kind == FeedKind.CUSTOMER }
  val movements = items.filter { it.kind != FeedKind.PAYMENT && it.kind != FeedKind.CUSTOMER }

  // Each subscription that started or grew with a payment: its customer's closest in time.
  val paidWith = mutableMapOf<String, FeedEntry>()
  val paid = mutableSetOf<String>()
  for (movement in movements.filter { it.isMrrIncrease }) {
    val payment =
      payments
        .filter { it.id !in paid && startedBy(movement, it) }
        .minByOrNull { abs(it.occurredAt - movement.occurredAt) } ?: continue
    paidWith[movement.id] = payment
    paid += payment.id
  }
  val celebrated = payments + movements.filter { it.isMrrIncrease }
  val absorbed =
    customers.filter { customer -> celebrated.any { sameCheckout(it, customer) } }.map { it.id }

  val groups = items.mapNotNull { item ->
    if (item.id in paid || item.id in absorbed) return@mapNotNull null
    when (item.kind) {
      FeedKind.PAYMENT -> MomentGroup(listOf(Moment.Payment(item)), item.occurredAt)
      FeedKind.CUSTOMER -> MomentGroup(listOf(Moment.Customer(item)), item.occurredAt)
      else -> {
        val payment = paidWith[item.id]
        if (payment == null) MomentGroup(listOf(Moment.Movement(item)), item.occurredAt)
        else
          MomentGroup(
            listOf(Moment.Movement(item), Moment.Payment(payment)),
            minOf(item.occurredAt, payment.occurredAt),
          )
      }
    }
  }
  if (groups.size < BURST_SIZE) return groups

  val last = items.last()
  val summary =
    Moment.Summary(
      id = "summary:${last.id}",
      accountId = last.accountId,
      events = items.map { it.event }.toSet(),
      payments = payments.size,
      changes = movements.size,
      customers = customers.size,
      revenue = payments.sumOf { it.ownRevenue },
      mrrChange = movements.sumOf { it.ownRevenue },
    )
  return listOf(MomentGroup(listOf(summary), items.maxOf { it.occurredAt }))
}

/** Matched on the customer's key: a payment may carry another name than its customer. */
private fun sameCheckout(a: FeedEntry, b: FeedEntry): Boolean =
  a.customerKey != null &&
    a.customerKey == b.customerKey &&
    abs(a.occurredAt - b.occurredAt) <= SAME_CHECKOUT_MILLIS

/** A payment made for a Stripe Connect account never pays for the account's subscriptions. */
private fun startedBy(movement: FeedEntry, payment: FeedEntry): Boolean =
  !payment.connect && sameCheckout(payment, movement)

/**
 * The first payment of a customer without a subscription may start one a few seconds later: it
 * waits for the next state, to be announced after its subscription rather than before.
 */
private val FeedEntry.awaitsSubscription: Boolean
  get() = kind == FeedKind.PAYMENT && !connect && customerKey != null && customerSubscribed == false

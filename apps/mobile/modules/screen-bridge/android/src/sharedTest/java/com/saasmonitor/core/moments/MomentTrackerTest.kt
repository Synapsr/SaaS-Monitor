package com.saasmonitor.core.moments

import com.saasmonitor.core.display.SampleSnapshots
import com.saasmonitor.core.state.FeedEntry
import com.saasmonitor.core.state.FeedKind
import com.saasmonitor.core.state.ScreenEvent
import com.saasmonitor.core.state.ScreenSnapshot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MomentTrackerTest {
  private val now = 1_790_000_000_000L
  private val minute = 60_000L

  private fun state(
    feed: List<FeedEntry>,
    testEventId: String? = null,
    mrr: Long = 1_248_000,
    shown: Set<ScreenEvent> = ScreenEvent.entries.toSet(),
  ): ScreenSnapshot {
    val base = SampleSnapshots.acme(now = now)
    return base.copy(
      feed = feed,
      testEventId = testEventId,
      mrr = mrr,
      accounts = listOf(ScreenSnapshot.Account("acct", "Acme")),
      settings = base.settings.copy(momentEvents = shown),
    )
  }

  private fun item(
    id: String,
    kind: FeedKind,
    at: Long = now,
    customerKey: String? = null,
    subscribed: Boolean? = null,
    amount: Long = 4_900,
  ) =
    FeedEntry(
      id = id,
      kind = kind,
      amount = amount,
      occurredAt = at,
      customer = null,
      planName = null,
      country = null,
      connect = false,
      churnReason = null,
      live = true,
      customerKey = customerKey,
      customerSubscribed = subscribed,
      accountId = "acct",
      accountName = "Acme",
    )

  private fun MomentTracker.play(vararg states: ScreenSnapshot): List<List<Moment>> {
    var tracker = this
    return states.map { state -> tracker.track(state).also { tracker = it.first }.second }
  }

  @Test
  fun `what was there when the screen opened never plays`() {
    val old = item("payment:1", FeedKind.PAYMENT, at = now - minute)
    val (first, second) = MomentTracker().play(state(listOf(old)), state(listOf(old)))
    assertEquals(emptyList<Moment>(), first)
    assertEquals(emptyList<Moment>(), second)
  }

  @Test
  fun `a new live item plays once`() {
    val old = item("payment:1", FeedKind.PAYMENT, at = now - minute)
    val new = item("payment:2", FeedKind.PAYMENT)
    val moments =
      MomentTracker().play(state(listOf(old)), state(listOf(new, old)), state(listOf(new, old)))
    assertEquals(listOf(emptyList(), listOf(Moment.Payment(new)), emptyList<Moment>()), moments)
  }

  @Test
  fun `events off the moment channel are left out`() {
    val new = item("movement:1", FeedKind.CHURN, amount = -2_900)
    val shown = ScreenEvent.entries.toSet() - ScreenEvent.CANCELLATION
    val moments =
      MomentTracker().play(state(emptyList(), shown = shown), state(listOf(new), shown = shown))
    assertEquals(emptyList<Moment>(), moments.last())
  }

  @Test
  fun `a new subscription plays before the payment that started it`() {
    val payment = item("payment:1", FeedKind.PAYMENT, at = now, customerKey = "c")
    val subscription = item("movement:1", FeedKind.NEW, at = now + 2_000, customerKey = "c")
    val customer = item("customer:1", FeedKind.CUSTOMER, at = now - 1_000, customerKey = "c")
    val moments =
      MomentTracker().play(state(emptyList()), state(listOf(subscription, payment, customer)))
    assertEquals(listOf(Moment.Movement(subscription), Moment.Payment(payment)), moments.last())
  }

  @Test
  fun `a first payment waits a poll for its subscription`() {
    val payment = item("payment:1", FeedKind.PAYMENT, customerKey = "c", subscribed = false)
    val subscription = item("movement:1", FeedKind.NEW, at = now + 3_000, customerKey = "c")
    val moments =
      MomentTracker()
        .play(state(emptyList()), state(listOf(payment)), state(listOf(subscription, payment)))
    assertEquals(emptyList<Moment>(), moments[1])
    assertEquals(listOf(Moment.Movement(subscription), Moment.Payment(payment)), moments[2])
  }

  @Test
  fun `a burst is summed up`() {
    val burst =
      (1..5).map { item("payment:$it", FeedKind.PAYMENT, at = now + it, customerKey = "c$it") }
    val moments = MomentTracker().play(state(emptyList()), state(burst.reversed()))
    val summary = moments.last().single() as Moment.Summary
    assertEquals(5, summary.payments)
    assertEquals(5 * 4_900L, summary.revenue)
  }

  @Test
  fun `a new test event plays, the one already there does not`() {
    val moments =
      MomentTracker()
        .play(
          state(emptyList(), testEventId = "t1"),
          state(emptyList(), testEventId = "t1"),
          state(emptyList(), testEventId = "t2"),
        )
    assertEquals(listOf(emptyList(), emptyList(), listOf(Moment.Test("t2"))), moments)
  }

  @Test
  fun `crossing the goal plays it once`() {
    val moments =
      MomentTracker()
        .play(
          state(emptyList(), mrr = 1_490_000),
          state(emptyList(), mrr = 1_510_000),
          state(emptyList(), mrr = 1_490_000),
          state(emptyList(), mrr = 1_510_000),
        )
    val milestone = moments[1].single() as Moment.Milestone
    assertTrue(milestone.isGoal)
    assertEquals(1_500_000, milestone.amount)
    assertEquals(emptyList<Moment>(), moments[3])
  }
}

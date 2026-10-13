package com.saasmonitor.core.moments

import com.saasmonitor.core.state.FeedEntry
import com.saasmonitor.core.state.FeedKind
import com.saasmonitor.core.state.Metric
import com.saasmonitor.core.state.ScreenEvent

/**
 * Something worth a moment on screen, as the wall display celebrates it
 * (`src/lib/display/moments.ts` of the web app).
 */
sealed interface Moment {
  val id: String

  data class Payment(val payment: FeedEntry) : Moment {
    override val id = payment.id
  }

  /** A subscription that started, grew, came back, shrank or stopped. */
  data class Movement(val movement: FeedEntry) : Moment {
    override val id = movement.id
  }

  /** A Stripe customer created, who has not paid (yet). */
  data class Customer(val customer: FeedEntry) : Moment {
    override val id = customer.id
  }

  /** A milestone of the screen's metric crossed, in minor units of [metric]. */
  data class Milestone(val amount: Long, val metric: Metric, val isGoal: Boolean) : Moment {
    override val id = "milestone:${metric.wire}:$amount"
  }

  /** Many things at once for one account (e.g. after a reconnection): celebrated once. */
  data class Summary(
    override val id: String,
    val accountId: String,
    val events: Set<ScreenEvent>,
    val payments: Int,
    val changes: Int,
    val customers: Int,
    val revenue: Long,
    val mrrChange: Long,
  ) : Moment

  /** "Send a test celebration", clicked in the screen's settings. */
  data class Test(val testEventId: String) : Moment {
    override val id = "test:$testEventId"
  }
}

/** The events a moment plays: a test celebration plays as a payment. */
val Moment.playedEvents: Set<ScreenEvent>
  get() =
    when (this) {
      is Moment.Payment -> setOf(payment.event)
      is Moment.Movement -> setOf(movement.event)
      is Moment.Customer -> setOf(customer.event)
      is Moment.Milestone -> setOf(ScreenEvent.MILESTONE)
      is Moment.Summary -> events
      is Moment.Test -> setOf(ScreenEvent.PAYMENT)
    }

/** The account a moment comes from; `null` for the screen as a whole. */
val Moment.account: String?
  get() =
    when (this) {
      is Moment.Payment -> payment.accountId
      is Moment.Movement -> movement.accountId
      is Moment.Customer -> customer.accountId
      is Moment.Summary -> accountId
      is Moment.Milestone,
      is Moment.Test -> null
    }

/** Subscriptions starting, growing or coming back. */
internal val FeedEntry.isMrrIncrease: Boolean
  get() = kind == FeedKind.NEW || kind == FeedKind.EXPANSION || kind == FeedKind.REACTIVATION

/** What an item brings the account: a Connect payment only leaves its fee. */
internal val FeedEntry.ownRevenue: Long
  get() = if (connect) applicationFee ?: 0 else amount

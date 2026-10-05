package com.saasmonitor.core.state

import com.saasmonitor.core.display.Language

/**
 * What widgets, tiles and complications show of a screen: the part of its `DisplayState`
 * (`src/contract/` of the app, `src/lib/display/types.ts` of the web app) they need. Amounts are
 * integers in the minor unit of [currency]; recurring ones are MRR, whatever [Settings.metric].
 */
data class ScreenSnapshot(
  val screenName: String,
  val status: Status,
  /** ISO 4217, lowercase. */
  val currency: String,
  val settings: Settings,
  val mrr: Long,
  val mrr30DaysAgo: Long,
  val revenueToday: Long,
  /** Average revenue per paying customer: a test celebration plays a typical payment. */
  val arpu: Long = 0,
  /** Stripe customers created today, in the screen's time zone. */
  val customersCreatedToday: Long = 0,
  /** Most recent first: as sent when fetched, at most [MAX_FEED_ITEMS] once cached. */
  val feed: List<FeedEntry>,
  /** The screen's Stripe accounts: a moment names its account when there are several. */
  val accounts: List<Account> = emptyList(),
  /** Changes when "Send a test celebration" is clicked in the screen's settings. */
  val testEventId: String? = null,
  /** When the server made the state, in epoch milliseconds. */
  val generatedAt: Long,
) {
  data class Account(val id: String, val name: String)

  enum class Status(val wire: String) {
    /** No Stripe account linked yet. */
    EMPTY("empty"),
    /** The first import is running: metrics are incomplete. */
    IMPORTING("importing"),
    READY("ready"),
    /** Every account is failing, e.g. a revoked key. */
    ERROR("error"),
  }

  data class Settings(
    val metric: Metric,
    /** Target of [metric] in major units, or `null` to follow the milestone ladder. */
    val goal: Long?,
    /** A preset name (`emerald`…) or a custom `#rrggbb`. */
    val accent: String,
    val theme: Theme,
    val language: Language,
    /** IANA time zone defining "today". */
    val timeZone: String,
    /** Events shown as moments (`settings.events[event].moment`): every one by default. */
    val momentEvents: Set<ScreenEvent> = ScreenEvent.entries.toSet(),
  )

  companion object {
    /** A watch shows a few items, the large widget one: the rest is not kept. */
    const val MAX_FEED_ITEMS = 5
  }
}

enum class Metric(val wire: String, val label: String) {
  MRR("mrr", "MRR"),
  ARR("arr", "ARR");

  /** A monthly amount (MRR, or a change of it) in this metric: ×12 for ARR, and nowhere else. */
  fun fromMrr(amount: Long): Long = if (this == ARR) amount * 12 else amount
}

enum class Theme(val wire: String) {
  DARK("dark"),
  LIGHT("light"),
}

/** What can happen on a screen (`SCREEN_EVENTS` of the web app), each shown as its settings say. */
enum class ScreenEvent(val wire: String) {
  PAYMENT("payment"),
  CONNECT_PAYMENT("connectPayment"),
  SUBSCRIPTION("subscription"),
  UPGRADE("upgrade"),
  REACTIVATION("reactivation"),
  DOWNGRADE("downgrade"),
  CANCELLATION("cancellation"),
  UNPAID("unpaid"),
  CUSTOMER("customer"),
  MILESTONE("milestone"),
}

/** An item of the screen's live feed (`FeedItem`). */
data class FeedEntry(
  val id: String,
  val kind: FeedKind,
  /** Payment amount, monthly MRR change (negative for losses), or 0 for a customer. */
  val amount: Long,
  val occurredAt: Long,
  /** The customer's name, else their email, when the screen shows them. */
  val customer: String?,
  val planName: String?,
  /** ISO 3166-1 alpha-2. */
  val country: String?,
  /** A payment collected for one of the account's Stripe Connect accounts. */
  val connect: Boolean,
  val churnReason: ChurnReason?,
  /** Detected by the live sync rather than imported: only these become moments. */
  val live: Boolean = false,
  /** The same for every item of a customer, and opaque. */
  val customerKey: String? = null,
  /** For a payment: whether its customer already had a subscription bringing MRR. */
  val customerSubscribed: Boolean? = null,
  /** What a Connect payment leaves the account, converted; `null` without a fee. */
  val applicationFee: Long? = null,
  /** When a subscription set not to renew ends. */
  val churnEndsAt: Long? = null,
  val accountId: String = "",
  val accountName: String = "",
) {
  /** The event this item is, as the screen's settings name it (`itemEvent`). */
  val event: ScreenEvent
    get() =
      when (kind) {
        FeedKind.PAYMENT -> if (connect) ScreenEvent.CONNECT_PAYMENT else ScreenEvent.PAYMENT
        FeedKind.CUSTOMER -> ScreenEvent.CUSTOMER
        FeedKind.NEW -> ScreenEvent.SUBSCRIPTION
        FeedKind.EXPANSION -> ScreenEvent.UPGRADE
        FeedKind.REACTIVATION -> ScreenEvent.REACTIVATION
        FeedKind.CONTRACTION -> ScreenEvent.DOWNGRADE
        // A failed payment is no customer leaving.
        FeedKind.CHURN ->
          if (churnReason == ChurnReason.UNPAID) ScreenEvent.UNPAID else ScreenEvent.CANCELLATION
      }
}

enum class FeedKind(val wire: String) {
  PAYMENT("payment"),
  CUSTOMER("customer"),
  NEW("new"),
  EXPANSION("expansion"),
  REACTIVATION("reactivation"),
  CONTRACTION("contraction"),
  CHURN("churn");

  /** Money in and customers won are good news; downgrades and cancellations are not. */
  val isGoodNews: Boolean
    get() = this != CONTRACTION && this != CHURN
}

enum class ChurnReason(val wire: String) {
  CANCELED("canceled"),
  SCHEDULED("scheduled"),
  UNPAID("unpaid"),
  PAUSED("paused"),
}

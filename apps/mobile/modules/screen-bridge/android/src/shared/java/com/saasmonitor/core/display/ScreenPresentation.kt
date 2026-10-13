package com.saasmonitor.core.display

import com.saasmonitor.core.state.ChurnReason
import com.saasmonitor.core.state.FeedEntry
import com.saasmonitor.core.state.FeedKind
import com.saasmonitor.core.state.Metric
import com.saasmonitor.core.state.ScreenSnapshot
import kotlin.math.floor
import kotlin.math.roundToInt

/**
 * A screen's numbers as widgets, tiles and complications write them: in its language and metric,
 * like the wall display's hero, goal and feed. Every surface renders from this, nothing else
 * formats amounts.
 */
class ScreenPresentation(val snapshot: ScreenSnapshot, val now: Long = System.currentTimeMillis()) {
  private val settings = snapshot.settings
  private val currency = snapshot.currency
  val language: Language = settings.language
  val text: DisplayText = language.text
  val metric: Metric = settings.metric

  /** "MRR" or "ARR", in every language. */
  val metricLabel: String = metric.label
  /** "Monthly recurring revenue", in the screen's language. */
  val metricName: String = if (metric == Metric.ARR) text.arrName else text.mrrName

  /** Recurring revenue in the screen's metric, minor units. */
  val value: Long = metric.fromMrr(snapshot.mrr)
  private val thirtyDaysAgo = metric.fromMrr(snapshot.mrr30DaysAgo)

  /** "$12,480": exact up to a million. */
  val valueText: String = Money.amount(value, currency, language.locale)
  /** "$12.5K", for complications and tiles. */
  val compactValueText: String = Money.compact(value, currency, language.locale)

  val growing: Boolean = value >= thirtyDaysAgo
  /** Not a cent of change in 30 days: neither up nor down. */
  val flat: Boolean = value == thirtyDaysAgo
  /** "+$1,120". */
  val growthAmountText: String =
    Money.amount(value - thirtyDaysAgo, currency, language.locale, signed = true)
  /** "+9.9%", or `null` without a month of history. */
  val growthPercentText: String? =
    percentChange(value, thirtyDaysAgo)?.let { formatPercent(it, language.locale, signed = true) }
  /** "+$1,120 · +9.9%". */
  val growthText: String = listOfNotNull(growthAmountText, growthPercentText).joinToString(" · ")

  /** Cash received today: never multiplied, whatever the metric. */
  val revenueTodayText: String = Money.amount(snapshot.revenueToday, currency, language.locale)

  val goal: GoalProgress = goalProgress(value, thirtyDaysAgo, settings.goal, currency, now)
  /** "Goal" or "Next milestone". */
  val goalTitle: String = if (goal.isGoal) text.goal else text.nextMilestone
  /** "$15K MRR". */
  val goalTargetText: String =
    "${Money.compact(goal.target, currency, language.locale)} $metricLabel"
  /** "83%": floored, so that 100% means reached. */
  val goalPercentText: String =
    formatPercent(floor((goal.progress * 1000.0).roundToInt() / 10.0) / 100, language.locale)
  /** "$2,520 to go". */
  val goalRemainingText: String = text.toGo(Money.amount(goal.remaining, currency, language.locale))
  /** "at this pace: Feb 2027", or `null` when not growing. */
  val goalEtaText: String? =
    goal.eta?.let { text.atThisPace(formatEta(it, now, settings.timeZone, language)) }

  val feed: List<FeedLine> = snapshot.feed.map(::line)

  // Watch and widget extras, computed on first use: most surfaces never read them.

  /** [valueText], and where its currency symbol is, to draw it smaller than the digits. */
  val valueMoney: MoneyText by lazy { Money.amountText(value, currency, language.locale) }
  /** [compactValueText], and where its currency symbol is. */
  val compactValueMoney: MoneyText by lazy { Money.compactText(value, currency, language.locale) }

  /** "30d": how far back the growth looks, on a badge. */
  val growthPeriodText: String = text.thirtyDaysShort

  /** Recurring revenue along the screen's chart, in its metric, oldest first. */
  val sparkline: List<Long> by lazy { snapshot.mrrSeries.map(metric::fromMrr) }

  /** "$1,240 yesterday": cash, never multiplied. */
  val revenueYesterdayText: String by lazy {
    text.yesterdayAmount(Money.amount(snapshot.revenueYesterday, currency, language.locale))
  }
  /** Cash received this month so far. */
  val monthToDateText: String by lazy {
    Money.amount(snapshot.revenueMonthToDate, currency, language.locale)
  }
  /** This month so far against the same days of the previous one; `null` without any then. */
  val monthChange: Double? by lazy {
    percentChange(snapshot.revenueMonthToDate, snapshot.revenuePreviousMonthToDate)
  }
  /** "+8.3%". */
  val monthChangeText: String? by lazy {
    monthChange?.let { formatPercent(it, language.locale, signed = true) }
  }
  /** "vs September" after [monthChangeText], or "vs $0 in September" without one. */
  val versusPreviousMonthText: String by lazy {
    val month = formatPreviousMonth(now, settings.timeZone, language)
    if (monthChange == null) text.versusAmount(Money.amount(0, currency, language.locale), month)
    else text.versus(month)
  }

  /** "5 min ago", for anything that happened at [at]. */
  fun timeAgo(at: Long): String = formatFeedTime(at, now, settings.timeZone, language)

  private fun line(entry: FeedEntry): FeedLine {
    val kind = kindLabel(entry)
    val amount = amountText(entry)
    // A new customer has no amount: their name leads, or what they are when it is hidden.
    val headline = amount ?: entry.customer ?: kind
    val details =
      listOfNotNull(
        kind.takeIf { headline != kind },
        entry.customer.takeIf { amount != null },
        entry.planName,
      )
    return FeedLine(
      id = entry.id,
      icon = FeedIcon.of(entry),
      isGoodNews = entry.kind.isGoodNews,
      headline = headline,
      metricSuffix = metricLabel.takeIf { amount != null && entry.kind != FeedKind.PAYMENT },
      details = details.joinToString(" · "),
      kindLabel = kind,
      time = timeAgo(entry.occurredAt),
      who =
        listOfNotNull(entry.customer.takeIf { amount != null }, entry.planName).joinToString(" · "),
    )
  }

  /** "Payment", "Connect", or why a subscription stopped counting ("Won't renew"). */
  private fun kindLabel(entry: FeedEntry): String =
    when {
      entry.connect -> text.connectPayment
      entry.churnReason == ChurnReason.SCHEDULED -> text.wontRenew
      entry.churnReason == ChurnReason.UNPAID -> text.paymentFailed
      entry.churnReason == ChurnReason.PAUSED -> text.paused
      else ->
        when (entry.kind) {
          FeedKind.PAYMENT -> text.payment
          FeedKind.CUSTOMER -> text.customer
          FeedKind.NEW -> text.newSubscription
          FeedKind.EXPANSION -> text.expansion
          FeedKind.REACTIVATION -> text.reactivation
          FeedKind.CONTRACTION -> text.contraction
          FeedKind.CHURN -> text.churn
        }
    }

  /** "$49" for a payment, "+$99" or "-$29" for a change of MRR, nothing for a new customer. */
  private fun amountText(entry: FeedEntry): String? =
    when (entry.kind) {
      FeedKind.CUSTOMER -> null
      FeedKind.PAYMENT -> Money.payment(entry.amount, currency, language.locale)
      else -> Money.amount(metric.fromMrr(entry.amount), currency, language.locale, signed = true)
    }
}

/** A feed item, written: "+$99 MRR", "New subscription · Jane Cooper · Pro", "5 min ago". */
data class FeedLine(
  val id: String,
  val icon: FeedIcon,
  /** Good news glow in the accent; losses stay neutral. */
  val isGoodNews: Boolean,
  /** The amount, else the customer, else the kind. */
  val headline: String,
  /** "MRR" or "ARR" after a subscription change. */
  val metricSuffix: String?,
  val details: String,
  val kindLabel: String,
  val time: String,
  /** [details] without the kind: "Jane Cooper · Pro", for layouts that say the kind apart. */
  val who: String = "",
)

/**
 * The icon of a feed item, as the web display picks it (`feed-kind-icon.tsx`): its kind's, the
 * Connect one, or why a subscription stopped. Drawables are `sm_kind_*`, `sm_churn_*` and
 * `sm_party`.
 */
enum class FeedIcon {
  PAYMENT,
  CONNECT,
  CUSTOMER,
  NEW,
  EXPANSION,
  REACTIVATION,
  CONTRACTION,
  CHURN,
  WONT_RENEW,
  UNPAID,
  PAUSED,
  /** Celebrations: a test, a milestone (`sm_party`). */
  PARTY;

  companion object {
    fun of(entry: FeedEntry): FeedIcon =
      when {
        entry.connect -> CONNECT
        entry.churnReason == ChurnReason.SCHEDULED -> WONT_RENEW
        entry.churnReason == ChurnReason.UNPAID -> UNPAID
        entry.churnReason == ChurnReason.PAUSED -> PAUSED
        else ->
          when (entry.kind) {
            FeedKind.PAYMENT -> PAYMENT
            FeedKind.CUSTOMER -> CUSTOMER
            FeedKind.NEW -> NEW
            FeedKind.EXPANSION -> EXPANSION
            FeedKind.REACTIVATION -> REACTIVATION
            FeedKind.CONTRACTION -> CONTRACTION
            FeedKind.CHURN -> CHURN
          }
      }
  }
}

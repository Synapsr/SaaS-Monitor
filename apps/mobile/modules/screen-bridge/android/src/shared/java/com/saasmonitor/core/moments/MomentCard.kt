package com.saasmonitor.core.moments

import com.saasmonitor.core.display.FeedIcon
import com.saasmonitor.core.display.Money
import com.saasmonitor.core.display.formatDate
import com.saasmonitor.core.state.ChurnReason
import com.saasmonitor.core.state.FeedEntry
import com.saasmonitor.core.state.FeedKind
import com.saasmonitor.core.state.ScreenSnapshot
import java.util.Locale
import kotlin.math.roundToLong

/**
 * A moment as its card says it, in the screen's language (`moment-overlay.tsx` of the web app):
 * "Payment received", "$49", "Jane Cooper · Pro · 🇫🇷 France".
 */
data class MomentCard(
  val icon: FeedIcon,
  /** The title: "Payment received", "New subscriber", "Won't renew"… */
  val eyebrow: String,
  /** An amount, or the name of a new customer ([headlineIsName]). */
  val headline: String,
  val headlineIsName: Boolean = false,
  /** "MRR" or "ARR" after a change of recurring revenue. */
  val metric: String? = null,
  /** The account it comes from, on a screen of several. */
  val account: String? = null,
  val details: String = "",
  val footnote: String? = null,
  /** Money in and customers won celebrate; losses are said plainly. */
  val celebration: Boolean,
) {
  companion object {
    fun of(moment: Moment, state: ScreenSnapshot): MomentCard {
      val language = state.settings.language
      val text = language.text
      val locale = language.locale
      val currency = state.currency
      val metric = state.settings.metric
      val account =
        if (state.accounts.size < 2) null
        else state.accounts.firstOrNull { it.id == moment.account }?.name
      val payment = { amount: Long -> Money.payment(amount, currency, locale) }
      // Subscription changes in the screen's metric: "+$149" of MRR is "+$1,788" of ARR.
      val change = { mrr: Long ->
        Money.amount(metric.fromMrr(mrr), currency, locale, signed = true)
      }

      return when (moment) {
        is Moment.Payment -> {
          val item = moment.payment
          MomentCard(
            icon = if (item.connect) FeedIcon.CONNECT else FeedIcon.PAYMENT,
            eyebrow = if (item.connect) text.connectPaymentTitle else text.paymentReceived,
            headline = payment(item.amount),
            account = account,
            details = context(item, language.locale),
            footnote =
              item.applicationFee
                ?.takeIf { item.connect && it > 0 }
                ?.let { text.connectFee(payment(it)) },
            celebration = true,
          )
        }
        is Moment.Movement -> {
          val item = moment.movement
          MomentCard(
            icon = FeedIcon.of(item),
            eyebrow =
              when (item.churnReason) {
                ChurnReason.SCHEDULED -> text.wontRenewTitle
                ChurnReason.UNPAID -> text.paymentFailedTitle
                ChurnReason.PAUSED -> text.pausedTitle
                else ->
                  when (item.kind) {
                    FeedKind.NEW -> text.newSubscriber
                    FeedKind.EXPANSION -> text.upgradeTitle
                    FeedKind.REACTIVATION -> text.welcomeBack
                    FeedKind.CONTRACTION -> text.downgradeTitle
                    else -> text.canceledTitle
                  }
              },
            headline = change(item.amount),
            metric = metric.label,
            account = account,
            details = context(item, locale),
            footnote =
              when (item.churnReason) {
                ChurnReason.SCHEDULED ->
                  item.churnEndsAt?.let {
                    text.endsOn(formatDate(it, state.settings.timeZone, language))
                  }
                ChurnReason.UNPAID -> text.unpaidDetails
                else -> null
              },
            celebration = item.isMrrIncrease,
          )
        }
        is Moment.Customer -> {
          // Named when the screen shows names, else by where they come from.
          val item = moment.customer
          val country = item.country?.let { country(it, locale) }
          MomentCard(
            icon = FeedIcon.CUSTOMER,
            eyebrow = text.newCustomerTitle,
            headline = item.customer ?: country ?: text.someoneNew,
            headlineIsName = true,
            account = account,
            details = if (item.customer != null && country != null) country else "",
            footnote = state.customersCreatedToday.takeIf { it > 0 }?.let(text::customersToday),
            celebration = true,
          )
        }
        is Moment.Summary -> {
          val received = moment.revenue > 0
          MomentCard(
            icon = FeedIcon.PAYMENT,
            eyebrow = text.catchingUp,
            headline = if (received) payment(moment.revenue) else change(moment.mrrChange),
            metric = metric.label.takeUnless { received },
            account = account,
            details =
              listOfNotNull(
                  moment.payments.takeIf { it > 0 }?.let(text::payments),
                  moment.changes.takeIf { it > 0 }?.let(text::changes),
                  moment.customers.takeIf { it > 0 }?.let(text::customers),
                )
                .joinToString(" · "),
            footnote =
              "${change(moment.mrrChange)} ${metric.label}"
                .takeIf {
                  received && moment.mrrChange != 0L
                },
            celebration = received || moment.mrrChange >= 0,
          )
        }
        is Moment.Test ->
          MomentCard(
            icon = FeedIcon.PARTY,
            eyebrow = text.testCelebration,
            headline = payment(testPaymentAmount(state)),
            details = text.testDetails,
            celebration = true,
          )
        is Moment.Milestone ->
          MomentCard(
            icon = FeedIcon.PARTY,
            eyebrow = if (moment.isGoal) text.goalReached else text.milestoneReached,
            headline = Money.compact(moment.amount, currency, locale),
            metric = moment.metric.label,
            celebration = true,
          )
      }
    }

    /**
     * The amount of a test celebration: a typical payment of this business, rounded, so that it
     * reads as a sample rather than as real money.
     */
    fun testPaymentAmount(state: ScreenSnapshot): Long {
      val typical =
        if (state.arpu > 0) maxOf(1, Money.toMajorUnits(state.arpu, state.currency).roundToLong())
        else 49
      return Money.toMinorUnits(typical.toDouble(), state.currency)
    }

    /** What a card says about an item: its customer, plan and country (`itemContext`). */
    private fun context(item: FeedEntry, locale: Locale): String =
      listOfNotNull(item.customer, item.planName, item.country?.let { country(it, locale) })
        .joinToString(" · ")

    /** "🇫🇷 France", in the screen's language. */
    private fun country(code: String, locale: Locale): String {
      val name = runCatching {
        Locale.Builder().setRegion(code).build().getDisplayCountry(locale)
      }
        .getOrNull()
        .orEmpty()
        .ifEmpty { code }
      val flag =
        code
          .uppercase(Locale.ROOT)
          .takeIf { it.length == 2 && it.all { letter -> letter in 'A'..'Z' } }
          ?.map { String(Character.toChars(REGIONAL_INDICATOR_A + (it - 'A'))) }
          ?.joinToString("")
      return listOfNotNull(flag, name).joinToString(" ")
    }

    private const val REGIONAL_INDICATOR_A = 0x1F1E6
  }
}

package com.saasmonitor.core.display

import com.saasmonitor.core.state.ChurnReason
import com.saasmonitor.core.state.FeedEntry
import com.saasmonitor.core.state.FeedKind
import com.saasmonitor.core.state.Metric
import com.saasmonitor.core.state.ScreenSnapshot
import com.saasmonitor.core.state.Theme
import kotlin.math.sin

/** A believable screen for previews: widget pickers, Compose previews, tile previews. */
object SampleSnapshots {
  private const val MINUTE = 60_000L

  fun acme(
    now: Long = System.currentTimeMillis(),
    accent: String = "emerald",
    theme: Theme = Theme.DARK,
    language: Language = Language.EN,
    metric: Metric = Metric.MRR,
  ) =
    ScreenSnapshot(
      screenName = "Acme Analytics",
      status = ScreenSnapshot.Status.READY,
      currency = "usd",
      settings =
        ScreenSnapshot.Settings(
          metric = metric,
          goal = if (metric == Metric.ARR) 200_000 else 15_000,
          accent = accent,
          theme = theme,
          language = language,
          timeZone = "Europe/Paris",
        ),
      mrr = 1_248_000,
      mrr30DaysAgo = 1_136_000,
      revenueToday = 124_000,
      feed =
        listOf(
          entry(
            "p1",
            FeedKind.PAYMENT,
            4_900,
            now - 4 * MINUTE,
            customer = "Jane Cooper",
            plan = "Pro",
          ),
          entry(
            "m1",
            FeedKind.NEW,
            9_900,
            now - 38 * MINUTE,
            customer = "Northwind",
            plan = "Business",
          ),
          entry("c1", FeedKind.CUSTOMER, 0, now - 2 * 60 * MINUTE, country = "FR"),
          entry(
            "m2",
            FeedKind.EXPANSION,
            5_000,
            now - 5 * 60 * MINUTE,
            customer = "Globex",
            plan = "Scale",
          ),
          entry(
            "m3",
            FeedKind.CHURN,
            -2_900,
            now - 26 * 60 * MINUTE,
            plan = "Starter",
            churn = ChurnReason.SCHEDULED,
          ),
        ),
      generatedAt = now,
      mrrSeries = SERIES,
      revenueYesterday = 98_000,
      revenueMonthToDate = 1_486_000,
      revenuePreviousMonthToDate = 1_372_000,
    )

  /** Two months of a business that grows, with the dips of real life, ending at today's MRR. */
  private val SERIES: List<Long> =
    List(61) { day ->
      val trend = 1_020_000 + day * 3_800L
      val wobble = (sin(day / 3.0) * 9_000 + sin(day / 7.0) * 14_000).toLong()
      if (day == 60) 1_248_000 else trend + wobble
    }

  private fun entry(
    id: String,
    kind: FeedKind,
    amount: Long,
    at: Long,
    customer: String? = null,
    plan: String? = null,
    country: String? = null,
    churn: ChurnReason? = null,
  ) =
    FeedEntry(
      id = id,
      kind = kind,
      amount = amount,
      occurredAt = at,
      customer = customer,
      planName = plan,
      country = country,
      connect = false,
      churnReason = churn,
    )
}

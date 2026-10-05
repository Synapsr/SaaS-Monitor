package com.saasmonitor.core.state

import com.saasmonitor.core.display.Language
import com.saasmonitor.core.optNullableString
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import org.json.JSONArray
import org.json.JSONObject

/**
 * Reads a `DisplayState` into a [ScreenSnapshot], and writes a snapshot back as a smaller
 * `DisplayState` (the fields it keeps), so that caches are read by the same code as the server.
 * Unknown values from a newer server fall back to defaults rather than failing.
 */
object DisplayStateJson {
  fun parse(json: String): ScreenSnapshot {
    val root = JSONObject(json)
    val screen = root.getJSONObject("screen")
    val settings = screen.optJSONObject("settings") ?: JSONObject()
    val metrics = root.getJSONObject("metrics")
    val feed = root.optJSONArray("feed") ?: JSONArray()
    return ScreenSnapshot(
      screenName = screen.optString("name"),
      status = enumOf(root.optString("status"), ScreenSnapshot.Status.READY) { it.wire },
      currency = root.optString("currency", "usd").lowercase(Locale.ROOT),
      settings =
        ScreenSnapshot.Settings(
          metric = enumOf(settings.optString("metric"), Metric.MRR) { it.wire },
          goal = if (settings.isNull("goal")) null else settings.optLong("goal").takeIf { it > 0 },
          accent = settings.optString("accent", "emerald"),
          theme = enumOf(settings.optString("theme"), Theme.DARK) { it.wire },
          language = enumOf(settings.optString("language"), Language.EN) { it.code },
          timeZone = settings.optString("timeZone", "UTC"),
        ),
      mrr = metrics.optLong("mrr"),
      mrr30DaysAgo = metrics.optLong("mrr30DaysAgo"),
      revenueToday = metrics.optJSONObject("revenue")?.optLong("today") ?: 0,
      feed =
        (0 until feed.length())
          .mapNotNull { feed.optJSONObject(it)?.let(::parseFeedEntry) }
          .take(ScreenSnapshot.MAX_FEED_ITEMS),
      generatedAt = IsoInstant.parse(root.optString("generatedAt")) ?: System.currentTimeMillis(),
    )
  }

  fun encode(snapshot: ScreenSnapshot): String {
    val settings = snapshot.settings
    return JSONObject()
      .put("generatedAt", IsoInstant.format(snapshot.generatedAt))
      .put(
        "screen",
        JSONObject()
          .put("name", snapshot.screenName)
          .put(
            "settings",
            JSONObject()
              .put("currency", snapshot.currency)
              .put("metric", settings.metric.wire)
              .put("goal", settings.goal ?: JSONObject.NULL)
              .put("accent", settings.accent)
              .put("theme", settings.theme.wire)
              .put("language", settings.language.code)
              .put("timeZone", settings.timeZone),
          ),
      )
      .put("currency", snapshot.currency)
      .put("status", snapshot.status.wire)
      .put(
        "metrics",
        JSONObject()
          .put("mrr", snapshot.mrr)
          .put("mrr30DaysAgo", snapshot.mrr30DaysAgo)
          .put("revenue", JSONObject().put("today", snapshot.revenueToday)),
      )
      .put("feed", JSONArray(snapshot.feed.map(::encodeFeedEntry)))
      .toString()
  }

  private fun parseFeedEntry(item: JSONObject): FeedEntry? {
    val kind = FeedKind.entries.firstOrNull { it.wire == item.optString("kind") } ?: return null
    val churn = item.optJSONObject("churn")
    return FeedEntry(
      id = item.optString("id"),
      kind = kind,
      amount = item.optLong("amount"),
      occurredAt = IsoInstant.parse(item.optString("occurredAt")) ?: return null,
      customer = item.optNullableString("customerName") ?: item.optNullableString("customerEmail"),
      planName = item.optNullableString("planName"),
      country = item.optNullableString("country"),
      connect = item.optJSONObject("connect") != null,
      churnReason =
        churn?.let { enumOf(it.optString("reason"), ChurnReason.CANCELED) { r -> r.wire } },
    )
  }

  private fun encodeFeedEntry(entry: FeedEntry): JSONObject =
    JSONObject()
      .put("id", entry.id)
      .put("kind", entry.kind.wire)
      .put("amount", entry.amount)
      .put("occurredAt", IsoInstant.format(entry.occurredAt))
      .put("customerName", entry.customer ?: JSONObject.NULL)
      .put("planName", entry.planName ?: JSONObject.NULL)
      .put("country", entry.country ?: JSONObject.NULL)
      .put("connect", if (entry.connect) JSONObject() else JSONObject.NULL)
      .put(
        "churn",
        entry.churnReason?.let { JSONObject().put("reason", it.wire) } ?: JSONObject.NULL,
      )

  private inline fun <reified T : Enum<T>> enumOf(
    value: String,
    default: T,
    wire: (T) -> String,
  ): T = enumValues<T>().firstOrNull { wire(it) == value } ?: default
}

/** ISO 8601 instants as `Date.toISOString()` writes them; `java.time` needs API 26. */
internal object IsoInstant {
  private val PATTERNS = listOf("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", "yyyy-MM-dd'T'HH:mm:ssXXX")

  fun parse(value: String): Long? {
    for (pattern in PATTERNS) {
      try {
        return formatter(pattern).parse(value)?.time
      } catch (_: ParseException) {}
    }
    return null
  }

  fun format(epochMillis: Long): String = formatter(PATTERNS.first()).format(Date(epochMillis))

  /** `SimpleDateFormat` is not thread-safe: one per call. */
  private fun formatter(pattern: String) =
    SimpleDateFormat(pattern, Locale.ROOT).apply { timeZone = TimeZone.getTimeZone("UTC") }
}

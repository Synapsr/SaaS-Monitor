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
    val accounts = root.optJSONArray("accounts") ?: JSONArray()
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
          momentEvents = momentEvents(settings.optJSONObject("events")),
        ),
      mrr = metrics.optLong("mrr"),
      mrr30DaysAgo = metrics.optLong("mrr30DaysAgo"),
      revenueToday = metrics.optJSONObject("revenue")?.optLong("today") ?: 0,
      arpu = metrics.optLong("arpu"),
      customersCreatedToday = metrics.optLong("customersCreatedToday"),
      feed = (0 until feed.length()).mapNotNull { feed.optJSONObject(it)?.let(::parseFeedEntry) },
      accounts =
        (0 until accounts.length()).mapNotNull { accounts.optJSONObject(it)?.let(::parseAccount) },
      testEventId = root.optJSONObject("testEvent")?.optNullableString("id"),
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
              .put("timeZone", settings.timeZone)
              .put(
                "events",
                JSONObject(
                  ScreenEvent.entries.associate {
                    it.wire to JSONObject().put("moment", it in settings.momentEvents)
                  }
                ),
              ),
          ),
      )
      .put("currency", snapshot.currency)
      .put("status", snapshot.status.wire)
      .put(
        "metrics",
        JSONObject()
          .put("mrr", snapshot.mrr)
          .put("mrr30DaysAgo", snapshot.mrr30DaysAgo)
          .put("revenue", JSONObject().put("today", snapshot.revenueToday))
          .put("arpu", snapshot.arpu)
          .put("customersCreatedToday", snapshot.customersCreatedToday),
      )
      // Widgets and watches show a few items: a cache keeps no more.
      .put(
        "feed",
        JSONArray(snapshot.feed.take(ScreenSnapshot.MAX_FEED_ITEMS).map(::encodeFeedEntry)),
      )
      .put(
        "accounts",
        JSONArray(snapshot.accounts.map { JSONObject().put("id", it.id).put("name", it.name) }),
      )
      .put("testEvent", snapshot.testEventId?.let { JSONObject().put("id", it) } ?: JSONObject.NULL)
      .toString()
  }

  private fun parseFeedEntry(item: JSONObject): FeedEntry? {
    val kind = FeedKind.entries.firstOrNull { it.wire == item.optString("kind") } ?: return null
    val churn = item.optJSONObject("churn")
    val connect = item.optJSONObject("connect")
    return FeedEntry(
      id = item.optString("id"),
      kind = kind,
      amount = item.optLong("amount"),
      occurredAt = IsoInstant.parse(item.optString("occurredAt")) ?: return null,
      customer = item.optNullableString("customerName") ?: item.optNullableString("customerEmail"),
      planName = item.optNullableString("planName"),
      country = item.optNullableString("country"),
      connect = connect != null,
      churnReason =
        churn?.let { enumOf(it.optString("reason"), ChurnReason.CANCELED) { r -> r.wire } },
      live = item.optBoolean("live"),
      customerKey = item.optNullableString("customerKey"),
      customerSubscribed =
        if (item.isNull("customerSubscribed")) null else item.optBoolean("customerSubscribed"),
      applicationFee =
        connect?.takeUnless { it.isNull("applicationFee") }?.optLong("applicationFee"),
      churnEndsAt = churn?.optNullableString("endsAt")?.let(IsoInstant::parse),
      accountId = item.optString("accountId"),
      accountName = item.optString("accountName"),
    )
  }

  private fun parseAccount(account: JSONObject): ScreenSnapshot.Account? =
    account
      .optString("id")
      .takeIf { it.isNotEmpty() }
      ?.let {
        ScreenSnapshot.Account(it, account.optString("name"))
      }

  /** Events whose `moment` channel is on; missing ones keep the default, on. */
  private fun momentEvents(events: JSONObject?): Set<ScreenEvent> =
    ScreenEvent.entries
      .filter { events?.optJSONObject(it.wire)?.optBoolean("moment", true) ?: true }
      .toSet()

  private fun encodeFeedEntry(entry: FeedEntry): JSONObject =
    JSONObject()
      .put("id", entry.id)
      .put("kind", entry.kind.wire)
      .put("amount", entry.amount)
      .put("occurredAt", IsoInstant.format(entry.occurredAt))
      .put("customerName", entry.customer ?: JSONObject.NULL)
      .put("planName", entry.planName ?: JSONObject.NULL)
      .put("country", entry.country ?: JSONObject.NULL)
      .put(
        "connect",
        if (entry.connect)
          JSONObject().put("applicationFee", entry.applicationFee ?: JSONObject.NULL)
        else JSONObject.NULL,
      )
      .put(
        "churn",
        entry.churnReason?.let { reason ->
          JSONObject()
            .put("reason", reason.wire)
            .put("endsAt", entry.churnEndsAt?.let(IsoInstant::format) ?: JSONObject.NULL)
        } ?: JSONObject.NULL,
      )
      .put("live", entry.live)
      .put("customerKey", entry.customerKey ?: JSONObject.NULL)
      .put("customerSubscribed", entry.customerSubscribed ?: JSONObject.NULL)
      .put("accountId", entry.accountId)
      .put("accountName", entry.accountName)

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

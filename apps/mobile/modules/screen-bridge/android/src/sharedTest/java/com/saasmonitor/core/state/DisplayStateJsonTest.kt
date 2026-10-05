package com.saasmonitor.core.state

import com.saasmonitor.core.display.Language
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DisplayStateJsonTest {
  /** A state as the server sends it, with fields widgets ignore and a kind from a newer server. */
  private val state =
    """
    {
      "version": "abc", "generatedAt": "2026-10-05T12:00:00.000Z",
      "screen": { "name": "Acme", "settings": {
        "currency": "eur", "timeZone": "Europe/Paris", "metric": "arr", "goal": 600000,
        "accent": "#ff6b35", "theme": "light", "language": "fr", "sound": { "enabled": true } } },
      "currency": "eur", "status": "ready", "accounts": [],
      "metrics": { "mrr": 4235000, "mrr30DaysAgo": 4410000, "arr": 50820000,
        "revenue": { "today": 51990, "yesterday": 0, "monthToDate": 0, "previousMonthToDate": 0 } },
      "series": { "mrr": [{ "date": "2026-10-05", "value": 4235000 }] }, "views": [],
      "feed": [
        { "id": "payment:1", "kind": "payment", "amount": 4900, "original": null,
          "occurredAt": "2026-10-05T11:57:00.000Z", "live": true, "customerKey": "k",
          "customerName": null, "customerEmail": "j•••@gmail.com", "country": "FR", "planName": "Pro",
          "connect": { "applicationFee": 300 }, "customerSubscribed": true, "churn": null,
          "accountId": "a", "accountName": "Acme" },
        { "id": "movement:9", "kind": "refund", "amount": 1, "occurredAt": "2026-10-05T11:00:00.000Z" },
        { "id": "movement:2", "kind": "churn", "amount": -2900, "occurredAt": "2026-10-04T09:00:00Z",
          "customerName": "Globex", "customerEmail": null, "country": null, "planName": null,
          "connect": null, "churn": { "reason": "unpaid", "endsAt": null } }
      ],
      "testEvent": null, "personalizedVoice": false, "warnings": []
    }
    """

  @Test
  fun `reads what widgets show`() {
    val snapshot = DisplayStateJson.parse(state)
    assertEquals("Acme", snapshot.screenName)
    assertEquals("eur", snapshot.currency)
    assertEquals(Metric.ARR, snapshot.settings.metric)
    assertEquals(600_000L, snapshot.settings.goal)
    assertEquals(Theme.LIGHT, snapshot.settings.theme)
    assertEquals(Language.FR, snapshot.settings.language)
    assertEquals(4_235_000L, snapshot.mrr)
    assertEquals(51_990L, snapshot.revenueToday)
    assertEquals(1_791_201_600_000L, snapshot.generatedAt)
  }

  @Test
  fun `skips unknown kinds and reads customers, Connect and churns`() {
    val feed = DisplayStateJson.parse(state).feed
    assertEquals(listOf("payment:1", "movement:2"), feed.map { it.id })
    assertEquals("j•••@gmail.com", feed[0].customer)
    assertEquals(true, feed[0].connect)
    assertNull(feed[0].churnReason)
    assertEquals(ChurnReason.UNPAID, feed[1].churnReason)
  }

  @Test
  fun `a snapshot survives its cache`() {
    val snapshot = DisplayStateJson.parse(state)
    assertEquals(snapshot, DisplayStateJson.parse(DisplayStateJson.encode(snapshot)))
  }
}

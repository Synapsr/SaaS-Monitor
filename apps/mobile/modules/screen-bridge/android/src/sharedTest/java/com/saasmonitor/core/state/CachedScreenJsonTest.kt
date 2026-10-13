package com.saasmonitor.core.state

import org.junit.Assert.assertEquals
import org.junit.Test

class CachedScreenJsonTest {
  @Test
  fun `keeps why a screen has no fresh numbers`() {
    for (problem in ScreenProblem.entries) {
      val cached = CachedScreen(snapshot = null, fetchedAt = 1_700_000_000_000, problem = problem)
      assertEquals(cached, CachedScreenJson.decode(CachedScreenJson.encode(cached)))
    }
  }

  @Test
  fun `reads a problem a newer version wrote as none`() {
    val cached = CachedScreenJson.decode("""{ "fetchedAt": 0, "problem": "SLEEPING", "state": null }""")
    assertEquals(CachedScreen.NONE, cached)
  }

  @Test
  fun `reads nothing it can't parse as never fetched`() {
    assertEquals(CachedScreen.NONE, CachedScreenJson.decode("not json"))
    assertEquals(CachedScreen.NONE, CachedScreenJson.decode(null))
  }
}

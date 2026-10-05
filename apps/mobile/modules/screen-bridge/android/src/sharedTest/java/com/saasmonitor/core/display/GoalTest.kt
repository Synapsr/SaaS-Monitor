package com.saasmonitor.core.display

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class GoalTest {
  private val now = 1_790_000_000_000L

  @Test
  fun `the ladder goes 1, 2-5, 5 at every magnitude`() {
    assertEquals(100.0, nextMilestone(0.0), 0.0)
    assertEquals(250.0, nextMilestone(100.0), 0.0)
    assertEquals(2_500.0, nextMilestone(1_234.0), 0.0)
    assertEquals(10_000.0, nextMilestone(9_999.99), 0.0)
    assertEquals(1_000_000.0, nextMilestone(500_000.0), 0.0)
  }

  @Test
  fun `a goal ahead is the target, in minor units`() {
    val progress =
      goalProgress(
        current = 1_248_000,
        thirtyDaysAgo = 1_136_000,
        goal = 15_000,
        currency = "usd",
        now = now,
      )
    assertTrue(progress.isGoal)
    assertEquals(1_500_000, progress.target)
    assertEquals(252_000, progress.remaining)
    assertEquals(0.832f, progress.progress, 0.001f)
  }

  @Test
  fun `a reached goal hands over to the ladder`() {
    val progress =
      goalProgress(
        current = 1_600_000,
        thirtyDaysAgo = 1_500_000,
        goal = 15_000,
        currency = "usd",
        now = now,
      )
    assertFalse(progress.isGoal)
    assertEquals(2_500_000, progress.target)
  }

  @Test
  fun `the estimate needs growth`() {
    val flat =
      goalProgress(
        current = 1_000_000,
        thirtyDaysAgo = 1_000_000,
        goal = null,
        currency = "usd",
        now = now,
      )
    assertNull(flat.eta)
    // +$600 in 30 days, $1,000 to the $10K milestone: 50 days.
    val growing =
      goalProgress(
        current = 900_000,
        thirtyDaysAgo = 840_000,
        goal = null,
        currency = "usd",
        now = now,
      )
    assertEquals(now + 50L * 86_400_000, growing.eta)
  }

  @Test
  fun `zero-decimal currencies have no minor unit`() {
    val progress =
      goalProgress(
        current = 80_000,
        thirtyDaysAgo = 70_000,
        goal = 100_000,
        currency = "jpy",
        now = now,
      )
    assertEquals(100_000, progress.target)
  }
}

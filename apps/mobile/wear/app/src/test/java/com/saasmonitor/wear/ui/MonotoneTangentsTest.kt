package com.saasmonitor.wear.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MonotoneTangentsTest {
  private val xs = listOf(0f, 1f, 2f, 3f, 4f)

  @Test
  fun `a rising series never dips between its points`() {
    val tangents = monotoneTangents(xs, listOf(10f, 12f, 30f, 31f, 60f))
    assertTrue(tangents.joinToString(), tangents.all { it >= 0 })
  }

  @Test
  fun `peaks and plateaus stay flat, so the curve never overshoots them`() {
    // A peak at 2, then a plateau from 3 to 4.
    val tangents = monotoneTangents(xs, listOf(0f, 5f, 9f, 4f, 4f))
    assertEquals(0f, tangents[2], 0f)
    assertEquals(0f, tangents[3], 0f)
    assertEquals(0f, tangents[4], 0f)
  }

  @Test
  fun `steep jumps are tamed`() {
    // Fritsch–Carlson keeps each tangent within three times its segment's slope.
    val ys = listOf(0f, 0.1f, 50f, 50.1f, 50.2f)
    val tangents = monotoneTangents(xs, ys)
    for (i in 0 until xs.size - 1) {
      val slope = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i])
      assertTrue("$i: ${tangents[i]} vs $slope", tangents[i] <= 3 * slope + 1e-3f)
    }
  }

  @Test
  fun `a single point has nothing to draw`() {
    assertEquals(1, monotoneTangents(listOf(0f), listOf(1f)).size)
  }
}

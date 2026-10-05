package com.saasmonitor.core.display

import com.saasmonitor.core.state.Theme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AccentsTest {
  @Test
  fun `presets are the web's, by hand`() {
    assertEquals(0xFF34D399.toInt(), Accents.palette("emerald", Theme.DARK).glow)
    assertEquals(0xFF6D28D9.toInt(), Accents.palette("violet", Theme.LIGHT).ink)
  }

  @Test
  fun `unknown accents fall back to emerald`() {
    assertEquals(Accents.palette("emerald", Theme.DARK), Accents.palette("teal", Theme.DARK))
  }

  @Test
  fun `custom colors keep the contrast of their theme`() {
    for (seed in listOf("#ff6b35", "#1e3a8a", "#fef08a", "#000000", "#FFFFFF")) {
      val dark = Accents.palette(seed, Theme.DARK)
      val light = Accents.palette(seed, Theme.LIGHT)
      assertTrue(seed, contrastRatio(dark.glow, ScreenColors.of(Theme.DARK).background) >= 6.9)
      assertTrue(seed, contrastRatio(light.glow, ScreenColors.of(Theme.LIGHT).background) >= 2.9)
    }
  }

  @Test
  fun `oklch round-trips colors in gamut`() {
    val color = parseHexColor("#ff6b35")
    assertEquals(color, fromOklch(toOklch(color)))
  }
}

package com.saasmonitor.core.display

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DisplayTextTest {
  @Test
  fun `every language fills its templates`() {
    for (language in Language.entries) {
      val text = language.text
      for (filled in
        listOf(
          text.yesterdayAmount("12 €"),
          text.versus("septembre"),
          text.versusAmount("12 €", "septembre"),
        )) {
        assertFalse("$language: $filled", filled.contains('{'))
      }
      assertTrue(language.name, text.versusAmount("12 €", "septembre").contains("12 €"))
      assertTrue(language.name, text.live.isNotBlank())
      assertTrue(language.name, text.thisMonth.isNotBlank())
      assertTrue(language.name, text.thirtyDaysShort.startsWith("30"))
    }
  }

  @Test
  fun `the words are the wall display's`() {
    assertEquals("En direct", Language.FR.text.live)
    assertEquals("171 € hier", Language.FR.text.yesterdayAmount("171 €"))
    assertEquals("vs. 0 € im September", Language.DE.text.versusAmount("0 €", "September"))
  }
}

package com.saasmonitor.core.display

import android.icu.text.DateFormat
import android.icu.util.Calendar
import android.icu.util.TimeZone
import kotlin.math.max
import kotlin.math.roundToInt

/** Dates and times as a screen writes them (`src/lib/display/time.ts`), in its zone and locale. */
private const val MINUTE_MILLIS = 60_000L
private const val HOUR_MILLIS = 3_600_000L
private const val DAY_MILLIS = 86_400_000L

/**
 * When something happened, short enough for a narrow column: "just now", "5 min ago", "3 h ago",
 * "yesterday", "Mon", then "Sep 12".
 */
fun formatFeedTime(at: Long, now: Long, timeZone: String, language: Language): String {
  val text = language.text
  val elapsed = max(0, now - at)
  if (elapsed < 45_000) return text.justNow
  if (elapsed < HOUR_MILLIS) {
    return text.minutesAgo(max(1, (elapsed.toDouble() / MINUTE_MILLIS).roundToInt()))
  }
  val age = calendarDay(now, timeZone) - calendarDay(at, timeZone)
  if (age == 0 || elapsed < 6 * HOUR_MILLIS) return text.hoursAgo((elapsed / HOUR_MILLIS).toInt())
  if (age == 1) return text.yesterday
  if (age < 7) return format(at, "EEE", timeZone, language)
  val sameYear = year(at, timeZone) == year(now, timeZone)
  return format(at, if (sameYear) "MMMd" else "yMMMd", timeZone, language)
}

/** When a goal should be reached: "today", "tomorrow", a day when close ("Nov 3"), else a month. */
fun formatEta(eta: Long, now: Long, timeZone: String, language: Language): String {
  val days = (eta - now).toDouble() / DAY_MILLIS
  return when {
    days < 1 -> language.text.today
    days < 2 -> language.text.tomorrow
    days < 45 -> format(eta, "MMMd", timeZone, language)
    else -> format(eta, "yMMM", timeZone, language)
  }
}

private fun calendar(at: Long, timeZone: String): Calendar =
  Calendar.getInstance(TimeZone.getTimeZone(timeZone)).apply { timeInMillis = at }

/** Days since an epoch, counted in [timeZone]: two instants of the same local day are equal. */
private fun calendarDay(at: Long, timeZone: String): Int =
  calendar(at, timeZone).get(Calendar.JULIAN_DAY)

private fun year(at: Long, timeZone: String): Int = calendar(at, timeZone).get(Calendar.YEAR)

private fun format(at: Long, skeleton: String, timeZone: String, language: Language): String =
  DateFormat.getInstanceForSkeleton(skeleton, language.locale)
    .apply { this.timeZone = TimeZone.getTimeZone(timeZone) }
    .format(java.util.Date(at))

/** A day in the screen's time zone, month in full: "October 29", "29 octobre". */
fun formatDate(at: Long, timeZone: String, language: Language): String =
  format(at, "MMMMd", timeZone, language)

/** The month before [now]'s, in full: "September", "septembre" (`formatMonth` of the web app). */
fun formatPreviousMonth(now: Long, timeZone: String, language: Language): String {
  val month =
    calendar(now, timeZone).apply {
      set(Calendar.DAY_OF_MONTH, 1)
      add(Calendar.MONTH, -1)
    }
  return format(month.timeInMillis, "MMMM", timeZone, language)
}

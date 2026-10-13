package com.saasmonitor.core.display

import android.icu.number.Notation
import android.icu.number.NumberFormatter
import android.icu.number.Precision
import android.icu.number.Scale
import android.icu.text.ConstrainedFieldPosition
import android.icu.text.NumberFormat
import android.icu.util.Currency
import android.icu.util.MeasureUnit
import android.icu.util.ULocale
import android.os.Build
import java.util.Locale
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.roundToLong

/**
 * Money as the web app writes it (`src/lib/money.ts`, `src/lib/display/format.ts`), with ICU like
 * the browser's `Intl`: "$12,480" in English, "12 480 $US" in French. Amounts are integers in the
 * currency's minor unit, like Stripe's.
 */
object Money {
  private val ZERO_DECIMAL =
    setOf(
      "bif",
      "clp",
      "djf",
      "gnf",
      "jpy",
      "kmf",
      "krw",
      "mga",
      "pyg",
      "rwf",
      "vnd",
      "vuv",
      "xaf",
      "xof",
      "xpf",
    )
  private val THREE_DECIMAL = setOf("bhd", "jod", "kwd", "omr", "tnd")

  /** Decimal digits of the minor unit: 2 for USD cents, 0 for JPY, 3 for KWD. */
  fun minorUnitDigits(currency: String): Int =
    when (currency.lowercase(Locale.ROOT)) {
      in ZERO_DECIMAL -> 0
      in THREE_DECIMAL -> 3
      else -> 2
    }

  fun toMajorUnits(amount: Long, currency: String): Double =
    amount / 10.0.pow(minorUnitDigits(currency))

  fun toMinorUnits(amount: Double, currency: String): Long =
    (amount * 10.0.pow(minorUnitDigits(currency))).roundToLong()

  /**
   * `formatMoney` of the web app. [compact] writes "$12.5K" (one decimal at most); [cents] shows
   * the minor unit; [signed] always shows the sign, as growth does.
   */
  fun format(
    amount: Long,
    currency: String,
    locale: Locale,
    compact: Boolean = false,
    cents: Boolean = false,
    signed: Boolean = false,
  ): String = formatted(amount, currency, locale, compact, cents, signed).text

  /**
   * [format], telling where the currency symbol is ("$" of "$12,480", " €" of "12 480 €") so that
   * it can be drawn smaller than the digits. ICU says it, whatever the side.
   */
  private fun formatted(
    amount: Long,
    currency: String,
    locale: Locale,
    compact: Boolean,
    cents: Boolean,
    signed: Boolean,
  ): MoneyText {
    val major = toMajorUnits(amount, currency)
    val digits = if (cents) minorUnitDigits(currency) else 0
    val icuCurrency = Currency.getInstance(currency.uppercase(Locale.ROOT))
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val number =
        NumberFormatter.withLocale(locale)
          .unit(icuCurrency)
          .notation(if (compact) Notation.compactShort() else Notation.simple())
          .precision(
            if (compact) Precision.minMaxFraction(0, 1) else Precision.fixedFraction(digits)
          )
          .sign(
            if (signed) NumberFormatter.SignDisplay.EXCEPT_ZERO
            else NumberFormatter.SignDisplay.AUTO
          )
          .format(major)
      val text = number.toString()
      val position =
        ConstrainedFieldPosition().apply { constrainField(NumberFormat.Field.CURRENCY) }
      val symbol =
        if (number.nextPosition(position)) symbolWithSpace(text, position.start, position.limit)
        else null
      return MoneyText(text, symbol)
    }
    // Before Android 11, ICU has no compact currencies: amounts are written in full.
    val format =
      NumberFormat.getCurrencyInstance(ULocale.forLocale(locale)).apply {
        this.currency = icuCurrency
        minimumFractionDigits = digits
        maximumFractionDigits = digits
      }
    val text = format.format(major)
    return MoneyText(if (signed && major > 0) "+$text" else text, symbol = null)
  }

  /** The symbol and the space between it and the digits: "12 480" then " €", "$" then "12,480". */
  private fun symbolWithSpace(text: String, start: Int, end: Int): IntRange {
    var from = start
    var to = end
    while (from > 0 && Character.isSpaceChar(text[from - 1])) from--
    while (to < text.length && Character.isSpaceChar(text[to])) to++
    return from until to
  }

  /** `formatAmount`: exact up to a million, compact beyond (`$1.2M`), so it stays glanceable. */
  fun amount(amount: Long, currency: String, locale: Locale, signed: Boolean = false): String =
    format(
      amount,
      currency,
      locale,
      compact = abs(toMajorUnits(amount, currency)) >= 1_000_000,
      signed = signed,
    )

  /** `formatPayment`: a payment shows its cents only when it has some, `$49` but `$49.99`. */
  fun payment(amount: Long, currency: String, locale: Locale): String {
    val hasCents = amount % 10.0.pow(minorUnitDigits(currency)).toLong() != 0L
    val compact = abs(toMajorUnits(amount, currency)) >= 1_000_000
    return format(amount, currency, locale, compact = compact, cents = hasCents && !compact)
  }

  /** "$12.5K": complications and other tight spots. */
  fun compact(amount: Long, currency: String, locale: Locale): String =
    format(amount, currency, locale, compact = true)

  /** [amount], with where its symbol is. */
  fun amountText(amount: Long, currency: String, locale: Locale): MoneyText =
    formatted(
      amount,
      currency,
      locale,
      compact = abs(toMajorUnits(amount, currency)) >= 1_000_000,
      cents = false,
      signed = false,
    )

  /** [compact], with where its symbol is. */
  fun compactText(amount: Long, currency: String, locale: Locale): MoneyText =
    formatted(amount, currency, locale, compact = true, cents = false, signed = false)
}

/**
 * An amount as [Money] writes it, and where its currency symbol sits ([symbol], with the space
 * that parts it from the digits), or `null` when ICU can't tell.
 */
data class MoneyText(val text: String, val symbol: IntRange?)

/** `formatPercent`: "+9.9%", "−3%", "+120%", one decimal only when it carries information. */
fun formatPercent(ratio: Double, locale: Locale, signed: Boolean = false): String {
  val fractionDigits = if (abs(ratio * 100) < 10) 1 else 0
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    return NumberFormatter.withLocale(locale)
      .unit(MeasureUnit.PERCENT)
      .scale(Scale.powerOfTen(2))
      .precision(Precision.minMaxFraction(0, fractionDigits))
      .sign(
        if (signed) NumberFormatter.SignDisplay.EXCEPT_ZERO else NumberFormatter.SignDisplay.AUTO
      )
      .format(ratio)
      .toString()
  }
  val format =
    NumberFormat.getPercentInstance(ULocale.forLocale(locale)).apply {
      maximumFractionDigits = fractionDigits
    }
  val text = format.format(ratio)
  return if (signed && ratio > 0) "+$text" else text
}

/** Relative change, or `null` when there is nothing to compare with. */
fun percentChange(current: Long, previous: Long): Double? =
  if (previous <= 0) null else (current - previous).toDouble() / previous

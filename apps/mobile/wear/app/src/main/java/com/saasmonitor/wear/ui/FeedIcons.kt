package com.saasmonitor.wear.ui

import com.saasmonitor.core.display.FeedIcon
import com.saasmonitor.wear.R

/** The shared icons (`sm_kind_*`, `sm_churn_*`), as the web display picks them. */
internal val FeedIcon.drawable: Int
  get() =
    when (this) {
      FeedIcon.PAYMENT -> R.drawable.sm_kind_payment
      FeedIcon.CONNECT -> R.drawable.sm_kind_connect
      FeedIcon.CUSTOMER -> R.drawable.sm_kind_customer
      FeedIcon.NEW -> R.drawable.sm_kind_new
      FeedIcon.EXPANSION -> R.drawable.sm_kind_expansion
      FeedIcon.REACTIVATION -> R.drawable.sm_kind_reactivation
      FeedIcon.CONTRACTION -> R.drawable.sm_kind_contraction
      FeedIcon.CHURN -> R.drawable.sm_kind_churn
      FeedIcon.WONT_RENEW -> R.drawable.sm_churn_scheduled
      FeedIcon.UNPAID -> R.drawable.sm_churn_unpaid
      FeedIcon.PAUSED -> R.drawable.sm_churn_paused
      FeedIcon.PARTY -> R.drawable.sm_party
    }

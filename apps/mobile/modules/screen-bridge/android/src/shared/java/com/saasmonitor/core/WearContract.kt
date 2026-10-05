package com.saasmonitor.core

/**
 * What the phone and the watch say to each other over the Wearable Data Layer. Both apps have the
 * same application id and signing key, which is what lets the Data Layer pair them.
 */
object WearContract {
  /** Data item holding the app's screens, `SharedScreenJson` under [SCREENS_KEY]. */
  const val SCREENS_PATH = "/screens"
  const val SCREENS_KEY = "screens"

  /** Message asking the watch to fetch its screens again (tile, complications). */
  const val RELOAD_PATH = "/reload"
}

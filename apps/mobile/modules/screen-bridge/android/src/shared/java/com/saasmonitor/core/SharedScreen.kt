package com.saasmonitor.core

import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject

/**
 * A screen of the app, as `ScreenBridge.setScreens` hands it over (`SharedScreen` in
 * `modules/screen-bridge/src/ScreenBridge.types.ts`): enough to fetch its state. Its token and
 * proof are credentials: they stay out of logs and are encrypted at rest ([ScreenStore]).
 */
data class SharedScreen(
  /** Stable and opaque: the first 16 hex characters of the SHA-256 of [token]. */
  val key: String,
  val name: String,
  /** Origin of the SaaS Monitor instance, without trailing slash. */
  val baseUrl: String,
  val token: String,
  /** Sent as `X-Screen-Access` to a password-protected screen. */
  val accessProof: String?,
) {
  /** `GET {baseUrl}/api/screens/{token}/state` (server API v1). */
  val stateUrl: String
    get() = "${baseUrl.trimEnd('/')}/api/screens/${Uri.encode(token)}/state"

  override fun toString(): String = "SharedScreen(key=$key, name=$name, baseUrl=$baseUrl)"
}

/** The JSON both the phone and the watch store screens as, and the Data Layer carries. */
object SharedScreenJson {
  fun encode(screens: List<SharedScreen>): String =
    JSONArray(
        screens.map { screen ->
          JSONObject()
            .put("key", screen.key)
            .put("name", screen.name)
            .put("baseUrl", screen.baseUrl)
            .put("token", screen.token)
            .put("accessProof", screen.accessProof ?: JSONObject.NULL)
        }
      )
      .toString()

  /** Screens of [json]; entries missing a field are skipped rather than failing the whole list. */
  fun decode(json: String): List<SharedScreen> {
    val array = JSONArray(json)
    return (0 until array.length()).mapNotNull { index ->
      val item = array.optJSONObject(index) ?: return@mapNotNull null
      val key = item.optString("key")
      val baseUrl = item.optString("baseUrl")
      val token = item.optString("token")
      if (key.isEmpty() || baseUrl.isEmpty() || token.isEmpty()) return@mapNotNull null
      SharedScreen(
        key = key,
        name = item.optString("name"),
        baseUrl = baseUrl,
        token = token,
        accessProof = item.optNullableString("accessProof"),
      )
    }
  }
}

/** `optString` returns "null" for a JSON null: this returns `null`, as for a missing field. */
internal fun JSONObject.optNullableString(name: String): String? =
  if (isNull(name)) null else optString(name)

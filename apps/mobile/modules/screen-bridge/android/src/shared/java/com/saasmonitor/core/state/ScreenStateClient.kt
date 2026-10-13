package com.saasmonitor.core.state

import com.saasmonitor.core.SharedScreen
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException

/** What fetching a screen's state gave. */
sealed interface FetchResult {
  data class Success(val snapshot: ScreenSnapshot) : FetchResult

  /** `401`: the screen asks for its password (it changed since the app stored a proof). */
  data object Locked : FetchResult

  /** `404`: the link no longer works (screen deleted, or its link regenerated). */
  data object Gone : FetchResult

  /** Offline, a server error or an unreadable answer: the last known values still stand. */
  data class Failed(val reason: String) : FetchResult
}

/** `GET {baseUrl}/api/screens/{token}/state`, the same endpoint wall displays poll. */
class ScreenStateClient(private val timeoutMillis: Int = 10_000) {
  suspend fun fetch(screen: SharedScreen): FetchResult =
    withContext(Dispatchers.IO) {
      val connection = URL(screen.stateUrl).openConnection() as HttpURLConnection
      try {
        connection.connectTimeout = timeoutMillis
        connection.readTimeout = timeoutMillis
        connection.setRequestProperty("Accept", "application/json")
        screen.accessProof?.let { connection.setRequestProperty("X-Screen-Access", it) }
        when (val status = connection.responseCode) {
          HttpURLConnection.HTTP_OK -> {
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            FetchResult.Success(DisplayStateJson.parse(body))
          }
          HttpURLConnection.HTTP_UNAUTHORIZED -> FetchResult.Locked
          HttpURLConnection.HTTP_NOT_FOUND -> FetchResult.Gone
          else -> FetchResult.Failed("HTTP $status")
        }
      } catch (error: IOException) {
        FetchResult.Failed(error.javaClass.simpleName)
      } catch (error: JSONException) {
        FetchResult.Failed("Unreadable state")
      } finally {
        connection.disconnect()
      }
    }
}

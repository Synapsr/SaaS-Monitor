package com.saasmonitor.core.state

import android.content.Context
import android.util.AtomicFile
import com.saasmonitor.core.SharedScreen
import java.io.File
import java.io.FileNotFoundException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject

/** Why a screen can't show fresh numbers, beyond being offline. */
enum class ScreenProblem {
  /** The screen asks for its password: the app must open it again. */
  LOCKED,
  /** The screen's link no longer works. */
  GONE,
}

/** The last known state of a screen: what widgets and watches show, online or not. */
data class CachedScreen(
  val snapshot: ScreenSnapshot?,
  /** When the last fetch succeeded, in epoch milliseconds; 0 if never. */
  val fetchedAt: Long,
  val problem: ScreenProblem?,
) {
  companion object {
    val NONE = CachedScreen(snapshot = null, fetchedAt = 0, problem = null)
  }
}

/** What a fetch gave: the screen to show, and the whole state when one was just fetched. */
data class Refresh(val cached: CachedScreen, val fetched: ScreenSnapshot?)

/** How a [CachedScreen] is stored: on disk here, and in each phone widget's state. */
object CachedScreenJson {
  fun encode(cached: CachedScreen): String =
    JSONObject()
      .put("fetchedAt", cached.fetchedAt)
      .put("problem", cached.problem?.name ?: JSONObject.NULL)
      .put(
        "state",
        cached.snapshot?.let { JSONObject(DisplayStateJson.encode(it)) } ?: JSONObject.NULL,
      )
      .toString()

  /** The cached screen of [json], or [CachedScreen.NONE] when it can't be read. */
  fun decode(json: String?): CachedScreen {
    if (json == null) return CachedScreen.NONE
    return try {
      val root = JSONObject(json)
      CachedScreen(
        snapshot = root.optJSONObject("state")?.let { DisplayStateJson.parse(it.toString()) },
        fetchedAt = root.optLong("fetchedAt"),
        problem = ScreenProblem.entries.firstOrNull { it.name == root.optString("problem") },
      )
    } catch (_: JSONException) {
      CachedScreen.NONE
    }
  }
}

/**
 * Fetches screens and keeps their last known state on disk, one small file per screen, so that
 * widgets, tiles and complications show something offline and right after a restart.
 */
class ScreenRepository(
  context: Context,
  private val client: ScreenStateClient = ScreenStateClient(),
) {
  private val directory = File(context.applicationContext.noBackupFilesDir, "screen-states")

  suspend fun cached(key: String): CachedScreen =
    withContext(Dispatchers.IO) {
      try {
        CachedScreenJson.decode(String(file(key).readFully()))
      } catch (_: FileNotFoundException) {
        CachedScreen.NONE
      }
    }

  /** Fetches [screen] and records the outcome; a failed fetch keeps the last known values. */
  suspend fun refresh(screen: SharedScreen): CachedScreen = fetch(screen).cached

  /** [refresh], telling apart the state just fetched: moments only come from fresh states. */
  suspend fun fetch(screen: SharedScreen): Refresh {
    val previous = cached(screen.key)
    val result = client.fetch(screen)
    val next =
      when (result) {
        is FetchResult.Success ->
          CachedScreen(result.snapshot, fetchedAt = System.currentTimeMillis(), problem = null)
        FetchResult.Locked -> previous.copy(problem = ScreenProblem.LOCKED)
        FetchResult.Gone -> previous.copy(problem = ScreenProblem.GONE)
        is FetchResult.Failed -> return Refresh(previous, fetched = null)
      }
    write(screen.key, next)
    return Refresh(next, fetched = (result as? FetchResult.Success)?.snapshot)
  }

  /** Forgets the states of screens the app no longer has. */
  suspend fun retainOnly(keys: Set<String>) =
    withContext(Dispatchers.IO) {
      directory.listFiles()?.forEach { if (it.nameWithoutExtension !in keys) it.delete() }
    }

  private suspend fun write(key: String, cached: CachedScreen) =
    withContext(Dispatchers.IO) {
      directory.mkdirs()
      val file = file(key)
      val stream = file.startWrite()
      try {
        stream.write(CachedScreenJson.encode(cached).toByteArray())
        file.finishWrite(stream)
      } catch (error: Exception) {
        file.failWrite(stream)
        throw error
      }
    }

  /** Keys are 16 hex characters: safe as file names. */
  private fun file(key: String) =
    AtomicFile(File(directory, "${key.filter(Char::isLetterOrDigit)}.json"))
}

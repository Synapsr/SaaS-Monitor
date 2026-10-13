package com.saasmonitor.core

import android.content.Context
import android.util.AtomicFile
import android.util.Log
import java.io.File
import java.io.FileNotFoundException
import java.security.GeneralSecurityException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/**
 * The screens handed over by the app (phone) or synced from it (watch). They are credentials:
 * encrypted with a Keystore key, in `noBackupFilesDir` so that a backup never carries them (the key
 * would not come along anyway).
 */
class ScreenStore(context: Context) {
  private val file = AtomicFile(File(context.applicationContext.noBackupFilesDir, FILE_NAME))
  private val box = SecretBox(KEY_ALIAS)

  suspend fun load(): List<SharedScreen> = withContext(Dispatchers.IO) { mutex.withLock { read() } }

  suspend fun save(screens: List<SharedScreen>) {
    withContext(Dispatchers.IO) {
      mutex.withLock {
        val sealed = box.seal(SharedScreenJson.encode(screens).toByteArray())
        val stream = file.startWrite()
        try {
          stream.write(sealed)
          file.finishWrite(stream)
        } catch (error: Exception) {
          file.failWrite(stream)
          throw error
        }
      }
    }
    revision.value += 1
  }

  /** The screens now and after every [save] in this process. */
  fun observe(): Flow<List<SharedScreen>> = revision.map { load() }

  private fun read(): List<SharedScreen> =
    try {
      SharedScreenJson.decode(String(box.open(file.readFully())))
    } catch (_: FileNotFoundException) {
      emptyList()
    } catch (error: GeneralSecurityException) {
      // The key is gone (e.g. the app's data was restored elsewhere): the app hands screens again.
      Log.w(TAG, "Screens can't be decrypted, forgetting them", error)
      file.delete()
      emptyList()
    }

  private companion object {
    const val TAG = "ScreenStore"
    const val FILE_NAME = "screens.bin"
    const val KEY_ALIAS = "saas-monitor-screens"
    /** One lock per process: widgets, workers and services share the file. */
    val mutex = Mutex()
    val revision = MutableStateFlow(0)
  }
}

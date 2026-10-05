package com.saasmonitor.core

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.nio.ByteBuffer
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * AES-GCM with a key that never leaves the Android Keystore. Jetpack's EncryptedSharedPreferences
 * is deprecated; this is the part of it the app needs. A sealed box is `[iv
 * length][iv][ciphertext]`.
 */
internal class SecretBox(private val alias: String) {
  fun seal(plaintext: ByteArray): ByteArray {
    val cipher = Cipher.getInstance(TRANSFORMATION).apply { init(Cipher.ENCRYPT_MODE, key()) }
    val iv = cipher.iv
    val ciphertext = cipher.doFinal(plaintext)
    return ByteBuffer.allocate(1 + iv.size + ciphertext.size)
      .put(iv.size.toByte())
      .put(iv)
      .put(ciphertext)
      .array()
  }

  fun open(box: ByteArray): ByteArray {
    val buffer = ByteBuffer.wrap(box)
    val iv = ByteArray(buffer.get().toInt()).also { buffer.get(it) }
    val ciphertext = ByteArray(buffer.remaining()).also { buffer.get(it) }
    val cipher =
      Cipher.getInstance(TRANSFORMATION).apply {
        init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(TAG_BITS, iv))
      }
    return cipher.doFinal(ciphertext)
  }

  private fun key(): SecretKey {
    val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
    (keyStore.getEntry(alias, null) as? KeyStore.SecretKeyEntry)?.let {
      return it.secretKey
    }
    val spec =
      KeyGenParameterSpec.Builder(
          alias,
          KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .build()
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
      .apply { init(spec) }
      .generateKey()
  }

  private companion object {
    const val KEYSTORE = "AndroidKeyStore"
    const val TRANSFORMATION = "AES/GCM/NoPadding"
    const val TAG_BITS = 128
  }
}

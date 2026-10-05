package com.saasmonitor.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.wear.ambient.AmbientLifecycleObserver
import com.saasmonitor.wear.ui.WearApp
import kotlinx.coroutines.flow.MutableStateFlow

class MainActivity : ComponentActivity() {
  /** The watch dozes with the app on screen: it stays resumed, but nothing should move. */
  private val ambient = MutableStateFlow(false)

  private val ambientObserver =
    AmbientLifecycleObserver(
      this,
      object : AmbientLifecycleObserver.AmbientLifecycleCallback {
        override fun onEnterAmbient(ambientDetails: AmbientLifecycleObserver.AmbientDetails) {
          ambient.value = true
        }

        override fun onExitAmbient() {
          ambient.value = false
        }
      },
    )

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    lifecycle.addObserver(ambientObserver)
    setContent {
      val isAmbient by ambient.collectAsState()
      WearApp(ambient = isAmbient)
    }
  }
}

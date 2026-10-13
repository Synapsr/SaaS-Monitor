plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.android)
  alias(libs.plugins.kotlin.compose)
}

/** Models, fetching and formatting shared with the phone's widgets. */
val shared = "../../modules/screen-bridge/android/src"

/** The store version of the apps, `version.json` at the root of the repository. */
@Suppress("UNCHECKED_CAST")
val release = groovy.json.JsonSlurper().parse(rootDir.resolve("../version.json")) as Map<String, Any>

android {
  namespace = "com.saasmonitor.wear"
  compileSdk = 36

  defaultConfig {
    // The phone app's id: the Wearable Data Layer only pairs apps with the same id and signature.
    applicationId = "com.saasmonitor.app"
    minSdk = 30
    targetSdk = 36
    // The phone app's, plus 10000: the phone and the watch bundles share the Play listing, and each
    // upload needs a code of its own.
    versionCode = 10_000 + ((release["android"] as Map<String, Any>)["versionCode"] as Int)
    versionName = release["version"] as String
  }

  signingConfigs {
    // Store builds sign with the phone app's upload key (plugins/withReleaseSigning.ts): the
    // Wearable Data Layer only pairs apps with the same id and signature.
    val uploadKey = findProperty("SAAS_MONITOR_UPLOAD_STORE_FILE") as String?
    if (uploadKey != null) {
      create("release") {
        storeFile = file(uploadKey)
        storePassword = findProperty("SAAS_MONITOR_UPLOAD_STORE_PASSWORD") as String?
        keyAlias = findProperty("SAAS_MONITOR_UPLOAD_KEY_ALIAS") as String?
        keyPassword = findProperty("SAAS_MONITOR_UPLOAD_KEY_PASSWORD") as String?
      }
    }
    // Debug builds sign with the phone app's debug key (Expo's template), so that they pair.
    getByName("debug") {
      val phoneDebugKey = file("../../android/app/debug.keystore")
      if (phoneDebugKey.exists()) {
        storeFile = phoneDebugKey
        storePassword = "android"
        keyAlias = "androiddebugkey"
        keyPassword = "android"
      }
    }
  }

  buildTypes {
    release {
      signingConfig = signingConfigs.findByName("release")
      isMinifyEnabled = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  buildFeatures {
    compose = true
  }

  sourceSets {
    getByName("main") {
      java.srcDir("$shared/shared/java")
      res.srcDir("$shared/shared/res")
    }
    getByName("test") {
      java.srcDir("$shared/sharedTest/java")
    }
  }
}

kotlin {
  jvmToolchain(17)
}

dependencies {
  implementation(libs.activity.compose)
  implementation(libs.lifecycle.runtime.compose)
  implementation(libs.lifecycle.viewmodel.compose)
  implementation(platform(libs.compose.bom))
  implementation(libs.compose.ui.tooling.preview)
  implementation(libs.wear.compose.material3)
  implementation(libs.wear.compose.foundation)
  implementation(libs.wear.compose.navigation)
  implementation(libs.wear.tooling.preview)
  implementation(libs.wear)

  implementation(libs.tiles)
  implementation(libs.tiles.tooling.preview)
  implementation(libs.protolayout)
  implementation(libs.protolayout.expression)
  implementation(libs.protolayout.material3)
  implementation(libs.complications.data.source.ktx)
  implementation(libs.concurrent.futures.ktx)

  implementation(libs.play.services.wearable)
  implementation(libs.coroutines.android)
  implementation(libs.coroutines.play.services)

  debugImplementation(libs.compose.ui.tooling)
  debugImplementation(libs.wear.compose.ui.tooling)
  debugImplementation(libs.tiles.tooling)
  debugImplementation(libs.tiles.renderer)

  testImplementation(libs.junit)
  // A real org.json: Android's is a stub in unit tests.
  testImplementation(libs.json)
}

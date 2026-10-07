import { type ConfigPlugin, withAppBuildGradle } from "expo/config-plugins";

/**
 * Signs Android release builds with the store upload key, read from Gradle properties kept out of
 * the repository (`~/.gradle/gradle.properties`, or `ORG_GRADLE_PROJECT_…` variables):
 * `SAAS_MONITOR_UPLOAD_STORE_FILE`, `…_STORE_PASSWORD`, `…_KEY_ALIAS`, `…_KEY_PASSWORD`. Without
 * them, releases keep the template's debug key: anyone can build the app, only the publisher can
 * upload it. The Wear OS app (`wear/`) reads the same properties.
 */

const RELEASE_SIGNING = `
        release {
            if (findProperty('SAAS_MONITOR_UPLOAD_STORE_FILE')) {
                storeFile file(findProperty('SAAS_MONITOR_UPLOAD_STORE_FILE'))
                storePassword findProperty('SAAS_MONITOR_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('SAAS_MONITOR_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('SAAS_MONITOR_UPLOAD_KEY_PASSWORD')
            }
        }`;

const TEMPLATE_DEBUG_SIGNING = `            keyPassword 'android'
        }
    }`;

const TEMPLATE_RELEASE = `            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const withReleaseSigning: ConfigPlugin = (config) =>
  withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents;
    if (gradle.includes("SAAS_MONITOR_UPLOAD_STORE_FILE")) return config;
    if (!gradle.includes(TEMPLATE_DEBUG_SIGNING) || !gradle.includes(TEMPLATE_RELEASE)) {
      // A template this plugin doesn't know: failing the prebuild beats shipping a debug key.
      throw new Error("withReleaseSigning: android/app/build.gradle doesn't match the expected template");
    }
    config.modResults.contents = gradle
      .replace(TEMPLATE_DEBUG_SIGNING, `            keyPassword 'android'\n        }${RELEASE_SIGNING}\n    }`)
      .replace(
        TEMPLATE_RELEASE,
        "            signingConfig findProperty('SAAS_MONITOR_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
      );
    return config;
  });

export default withReleaseSigning;

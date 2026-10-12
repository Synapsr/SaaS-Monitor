import type { ExpoConfig } from "expo/config";
import release from "./version.json";

/** Identifiers of the store apps. Self-hosted instances use the same apps: nothing to change. */
const BUNDLE_ID = "com.saasmonitor.app";
/** Shared by the app, its widgets and its watch app (iOS App Group). */
export const APP_GROUP = `group.${BUNDLE_ID}`;

const config: ExpoConfig = {
  name: "SaaS Monitor",
  slug: "saas-monitor",
  scheme: "saasmonitor",
  // Store versions live in `version.json`, with the build numbers to bump for each upload.
  version: release.version,
  orientation: "default",
  icon: "./assets/icon.png",
  // The app is dark like the wall display; a screen may still show its light theme.
  userInterfaceStyle: "dark",
  ios: {
    bundleIdentifier: BUNDLE_ID,
    // The app's targets (widgets, watch, notification extension) get it too: `with-build-number`.
    buildNumber: String(release.ios.buildNumber),
    supportsTablet: true,
    // Signing of the app and its targets; set APPLE_TEAM_ID to build for a device.
    appleTeamId: process.env.APPLE_TEAM_ID,
    config: {
      // HTTPS only, through the system: exempt from export compliance documentation.
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // Self-hosted instances on a local network (http://192.168.1.20:3000).
      NSLocalNetworkUsageDescription:
        "SaaS Monitor connects to the screens of SaaS Monitor instances on your local network.",
      // Images of screens saved to Photos; the app never reads the library.
      NSPhotoLibraryAddUsageDescription: "SaaS Monitor adds the images of your screens you save to Photos.",
    },
    entitlements: {
      "com.apple.security.application-groups": [APP_GROUP],
      // Moments are sent `time-sensitive`: they break through Focus, and Siri may announce them.
      "com.apple.developer.usernotifications.time-sensitive": true,
    },
  },
  android: {
    package: BUNDLE_ID,
    // The Wear OS app's is 10000 more (`wear/app/build.gradle.kts`): both share the Play listing.
    versionCode: release.android.versionCode,
    adaptiveIcon: {
      backgroundColor: "#0A0B0D",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // Declared by Expo's template (drawing over other apps), by expo-secure-store (biometrics) and
    // by expo-media-library and expo-screen-capture (reading photos): the app neither draws over
    // other apps nor locks its keychain items behind biometrics, and it only adds images to the
    // gallery, which Android 11 and later allow without a permission. Screenshots are detected
    // without reading photos too, from Android 14 (DETECT_SCREEN_CAPTURE).
    blockedPermissions: [
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_AUDIO",
      "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
      "android.permission.ACCESS_MEDIA_LOCATION",
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-localization",
    // Self-hosted instances may answer over plain HTTP on a local network, as iOS allows: the app
    // only reaches such hosts over HTTP (`src/screens/link.ts`).
    ["expo-build-properties", { android: { usesCleartextTraffic: true } }],
    [
      "expo-splash-screen",
      { backgroundColor: "#08090b", image: "./assets/splash-icon.png", imageWidth: 88 },
    ],
    // The logo's pulse in the brand emerald: Android and Wear OS draw notification icons as masks.
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#34d399",
        // Moments arrive on this channel (see AGENTS.md); the app creates it at launch.
        defaultChannel: "moments",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Scan the QR code of a screen to add it to SaaS Monitor.",
        // The camera only reads QR codes: no microphone.
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    // Before `@bacons/apple-targets`, whose targets it edits (see the file).
    "./targets/with-shared-code",
    "./targets/with-build-number",
    "@bacons/apple-targets",
    "./plugins/withAndroidWidgets",
    // iOS 27 stops apps that don't adopt the scene life cycle at launch.
    "./plugins/withSceneLifecycle",
    // Store builds sign with the upload key, kept out of the repository.
    "./plugins/withReleaseSigning",
  ],
  experiments: { typedRoutes: true },
};

export default config;

import type { ExpoConfig } from "expo/config";

/** Identifiers of the store apps. Self-hosted instances use the same apps: nothing to change. */
const BUNDLE_ID = "com.saasmonitor.app";
/** Shared by the app, its widgets and its watch app (iOS App Group). */
export const APP_GROUP = `group.${BUNDLE_ID}`;

const config: ExpoConfig = {
  name: "SaaS Monitor",
  slug: "saas-monitor",
  scheme: "saasmonitor",
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    // Signing of the app and its targets; set APPLE_TEAM_ID to build for a device.
    appleTeamId: process.env.APPLE_TEAM_ID,
    entitlements: { "com.apple.security.application-groups": [APP_GROUP] },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: "#0A0B0D",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-localization",
    "expo-build-properties",
    // The logo's pulse in the brand emerald: Android and Wear OS draw notification icons as masks.
    ["expo-notifications", { icon: "./assets/notification-icon.png", color: "#34d399" }],
    [
      "expo-camera",
      { cameraPermission: "Scan the QR code of a screen to add it to SaaS Monitor." },
    ],
    "@bacons/apple-targets",
    "./plugins/withAndroidWidgets",
  ],
  experiments: { typedRoutes: true },
};

export default config;

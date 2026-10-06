/**
 * Plays a moment's sound and voice as its notification's sound, on a locked phone too, when the
 * device asks for it (Settings, "Also when the phone is locked").
 */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "notification-service",
  name: "NotificationService",
  bundleIdentifier: ".notification-service",
  // The app's own: every iPhone that runs the app hears its moments.
  deploymentTarget: "16.4",
  frameworks: ["AVFoundation"],
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});

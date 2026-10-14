/** The Apple Watch app, fed with screens by the iPhone app (WatchConnectivity). */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "watch",
  name: "SaaSMonitorWatch",
  displayName: "SaaS Monitor",
  // Apple's convention: the watch app's identifier extends the iPhone app's.
  bundleIdentifier: ".watchkitapp",
  deploymentTarget: "11.0",
  // Its own icon: the phone's near-black one vanishes into the black of a watch face, so the
  // round mask doesn't show (App Review, guideline 4).
  icon: "../../assets/watch-icon.png",
  colors: { $accent: "#34D399" },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});

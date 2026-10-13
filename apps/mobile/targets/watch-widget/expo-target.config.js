/** Complications and Smart Stack widgets of the watch app, which embeds them. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "watch-widget",
  name: "WatchWidgets",
  displayName: "SaaS Monitor",
  // Embedded in the watch app: its identifier must extend the watch app's.
  bundleIdentifier: ".watchkitapp.widgets",
  deploymentTarget: "11.0",
  colors: {
    $accent: "#34D399",
    $widgetBackground: "#08090B",
  },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});

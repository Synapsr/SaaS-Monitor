/** Home screen, lock screen, StandBy and CarPlay widgets. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "ScreenWidgets",
  displayName: "SaaS Monitor",
  bundleIdentifier: ".widget",
  deploymentTarget: "18.0",
  colors: {
    $accent: "#34D399",
    $widgetBackground: "#08090B",
  },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});

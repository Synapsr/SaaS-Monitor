// Gives every Apple target the app's build number (`ios.buildNumber`, from `version.json`): App
// Store Connect wants the widgets, the watch app and the notification extension to carry their
// app's. `@bacons/apple-targets` only sets it when it creates a target.
//
// Register this plugin *before* `@bacons/apple-targets`, like `with-shared-code.js`: it then edits
// the project once the targets exist.

const { withXcodeProjectBeta } = require("@bacons/apple-targets/build/with-bacons-xcode");
const { PBXNativeTarget } = require("@bacons/xcode");

module.exports = function withBuildNumber(config) {
  const buildNumber = config.ios?.buildNumber;
  if (!buildNumber) return config;
  return withXcodeProjectBeta(config, (config) => {
    for (const target of config.modResults.rootObject.props.targets) {
      if (!PBXNativeTarget.is(target)) continue;
      for (const configuration of target.props.buildConfigurationList.props.buildConfigurations) {
        configuration.props.buildSettings.CURRENT_PROJECT_VERSION = buildNumber;
      }
    }
    return config;
  });
};

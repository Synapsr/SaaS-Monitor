import { type ConfigPlugin, withAppDelegate, withInfoPlist } from "expo/config-plugins";

/**
 * Adopts the UIScene life cycle, which iOS 27 requires: an app built with its SDK that still starts
 * from the app delegate is stopped at launch (`UIApplicationEvaluateRuntimeIssueForNoSceneLifecycle
 * Adoption`). Expo ships the scene delegate (`ExpoAppSceneDelegate`), but its app template still
 * creates the window in the app delegate: the scene delegate now does, from the factory the app
 * delegate creates.
 */

const SCENE_DELEGATE = "SceneDelegate";

/** The template's window, made in the app delegate; under scenes the scene delegate makes it. */
const TEMPLATE_WINDOW = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

const TEMPLATE_CLASS = "class AppDelegate: ExpoAppDelegate {";
const SCENE_CLASS = "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {";

function adoptScenes(source: string): string {
  if (source.includes(SCENE_CLASS)) return source;
  if (!source.includes(TEMPLATE_CLASS) || !source.includes(TEMPLATE_WINDOW)) {
    // A template this plugin doesn't know: failing the prebuild beats an app stopped at launch.
    throw new Error("withSceneLifecycle: AppDelegate.swift doesn't match the expected Expo template");
  }
  return (
    source.replace(TEMPLATE_CLASS, SCENE_CLASS).replace(TEMPLATE_WINDOW, "") +
    `
/// Starts React Native into the window of the app's scene (iOS 27 requires the scene life cycle).
class ${SCENE_DELEGATE}: ExpoAppSceneDelegate {}
`
  );
}

const withSceneLifecycle: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: `$(PRODUCT_MODULE_NAME).${SCENE_DELEGATE}`,
          },
        ],
      },
    };
    return config;
  });
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error("withSceneLifecycle: expects a Swift AppDelegate");
    }
    config.modResults.contents = adoptScenes(config.modResults.contents);
    return config;
  });
};

export default withSceneLifecycle;

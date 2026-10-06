import { NativeModule, requireNativeModule } from "expo";
import type { SharedScreen } from "./ScreenBridge.types";

declare class ScreenBridgeModule extends NativeModule {
  /**
   * Hands the app's screens to its widgets and watch apps, and refreshes them. iOS: the App
   * Group, WidgetKit, and the paired Apple Watch (WatchConnectivity). Android: the home screen
   * widgets, and paired Wear OS watches (Wearable Data Layer).
   */
  setScreens(screens: SharedScreen[]): Promise<void>;
  /** Asks widgets and complications to fetch their screens again, e.g. after a notification. */
  reloadWidgets(): Promise<void>;
  /**
   * Whether notifications play their moment's sound and voice, which the notification service
   * extension reads from the App Group. iOS only.
   */
  setNotificationAudio(enabled: boolean): Promise<void>;
}

export default requireNativeModule<ScreenBridgeModule>("ScreenBridge");

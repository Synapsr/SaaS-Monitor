import type { SharedScreen } from "./ScreenBridge.types";

/** The web has no widgets nor watches. */
export default {
  async setScreens(_screens: SharedScreen[]): Promise<void> {},
  async reloadWidgets(): Promise<void> {},
};

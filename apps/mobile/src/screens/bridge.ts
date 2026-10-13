import ScreenBridge, { type SharedScreen } from "../../modules/screen-bridge";
import { displayName, type SavedScreen } from "@/screens/types";

/** What widgets and watches need of a screen to fetch its state themselves. */
export function sharedScreen(screen: SavedScreen): SharedScreen {
  return {
    key: screen.key,
    name: displayName(screen),
    baseUrl: screen.baseUrl,
    token: screen.token,
    accessProof: screen.accessProof,
  };
}

let shared: string | null = null;

/**
 * Hands the screens to the widgets and watch apps. Only when what they see changed: a new proof,
 * name or order, not the look of a screen. Never throws: widgets are a bonus, not the app.
 */
export async function shareScreens(screens: readonly SavedScreen[]): Promise<void> {
  const payload = screens.map(sharedScreen);
  const serialized = JSON.stringify(payload);
  if (serialized === shared) return;
  shared = serialized;
  try {
    await ScreenBridge.setScreens(payload);
  } catch (error) {
    shared = null;
    console.warn("Screens could not be shared with widgets", error);
  }
}

/** Widgets and complications fetch their screens again, e.g. after a notification. */
export async function reloadWidgets(): Promise<void> {
  try {
    await ScreenBridge.reloadWidgets();
  } catch (error) {
    console.warn("Widgets could not be reloaded", error);
  }
}

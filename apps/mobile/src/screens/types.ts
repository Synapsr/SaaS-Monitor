import type { Accent, Language, Theme } from "@/contract/screens/settings";

/**
 * A screen added to the app. Its link is a credential: the whole record lives in the keychain
 * (`storage.ts`), and only the app, its widgets and its watch apps read it.
 */
export interface SavedScreen {
  /** First 16 hex characters of the SHA-256 of `token`: names the screen everywhere else. */
  key: string;
  /** Origin and path of its instance, without trailing slash. */
  baseUrl: string;
  token: string;
  /** Proof of the screen's password (`X-Screen-Access`), `null` for a screen without one. */
  accessProof: string | null;
  /** The screen's name on its instance, as last seen. */
  name: string;
  /** The name given on this device, if any: it wins over `name`. */
  alias: string | null;
  /** "Notifications on this device", on by default. */
  notify: boolean;
  /** How the screen looked last time, for what shows before its state arrives (a lock, a loader). */
  appearance: ScreenAppearance | null;
  addedAt: string;
}

export interface ScreenAppearance {
  theme: Theme;
  accent: Accent;
  language: Language;
}

/** The name a screen goes by on this device. */
export function displayName(screen: Pick<SavedScreen, "name" | "alias">): string {
  return screen.alias ?? screen.name;
}

import { LANGUAGE_NAMES } from "@/lib/display/i18n";
import { defaultScreenSettings, type ScreenSettings } from "@/lib/screens/settings";
import { SOUND_PACK_NAMES } from "@/lib/sounds";

export interface ScreenTag {
  kind: "language" | "sound" | "muted" | "voice";
  label: string;
}

/**
 * What tells a screen apart from the others of the list, beyond its name and what its preview
 * already shows (theme, accent, metric, currency). Its language and its sound are named when they
 * differ from the defaults, unless every screen of the list shares them; a silent screen and one
 * that speaks always say so, as that is what the room hears. A screen with the defaults has none.
 */
export function screenTags(settings: ScreenSettings, all: readonly ScreenSettings[]): ScreenTag[] {
  const stands = <T>(pick: (screen: ScreenSettings) => T) =>
    pick(settings) !== pick(defaultScreenSettings) &&
    (all.length < 2 || all.some((screen) => pick(screen) !== pick(settings)));
  const tags: ScreenTag[] = [];

  if (stands((screen) => screen.language)) {
    tags.push({ kind: "language", label: LANGUAGE_NAMES[settings.language] });
  }
  if (!settings.sound.enabled) {
    tags.push({ kind: "muted", label: "Sound off" });
  } else if (stands((screen) => (screen.sound.enabled ? screen.sound.pack : null))) {
    tags.push({ kind: "sound", label: SOUND_PACK_NAMES[settings.sound.pack] });
  }
  if (settings.voice.enabled) tags.push({ kind: "voice", label: "Voice" });
  return tags;
}

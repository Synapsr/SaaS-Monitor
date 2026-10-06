import "server-only";
import type { ScreenSettings } from "@/lib/screens/settings";
import { canSynthesize } from "./gradium";

/** Whether a screen says its own phrases: it asks to, and this server can synthesize them. */
export function speaksOwnPhrases({ voice }: Pick<ScreenSettings, "voice">): boolean {
  return voice.enabled && voice.personalized && canSynthesize();
}

import { SOUND_PACKS, type SoundPack } from "@/lib/screens/options";
import { SOUND_PACK_NAMES, type SoundEvent } from "@/lib/sounds";
import { soundClipUrl } from "@/lib/sounds/clips";

/**
 * The sounds of every pack as WAV files, to download from `/stripe-notification-sound`. Screens
 * synthesize their sounds live; these are the files the SaaS Monitor app plays, rendered from the
 * same recipes by `scripts/generate-sounds.ts`.
 */

/** Every sound a pack plays, in the order the page lists them. */
export const SOUND_EVENTS = [
  "payment",
  "customer",
  "mrrUp",
  "mrrDown",
  "milestone",
] as const satisfies readonly SoundEvent[];

export const SOUND_EVENT_LABELS: Record<SoundEvent, string> = {
  payment: "Payment",
  customer: "New customer",
  mrrUp: "MRR up",
  mrrDown: "MRR down",
  milestone: "Milestone",
};

export interface SoundFile {
  pack: SoundPack;
  event: SoundEvent;
  /** Where the file is served, e.g. `/sounds/register/payment.wav`. */
  url: string;
  /** The name it downloads as, which says where it comes from. */
  fileName: string;
  /** e.g. "Cash register · Payment". */
  title: string;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function soundFile(pack: SoundPack, event: SoundEvent): SoundFile {
  return {
    pack,
    event,
    url: soundClipUrl(pack, event),
    fileName: `saas-monitor-${slug(SOUND_PACK_NAMES[pack])}-${slug(SOUND_EVENT_LABELS[event])}.wav`,
    title: `${SOUND_PACK_NAMES[pack]} · ${SOUND_EVENT_LABELS[event]}`,
  };
}

/** Every file, pack by pack. */
export const SOUND_FILES: readonly SoundFile[] = SOUND_PACKS.flatMap((pack) =>
  SOUND_EVENTS.map((event) => soundFile(pack, event)),
);

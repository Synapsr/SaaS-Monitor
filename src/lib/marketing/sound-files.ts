import { SOUND_PACKS, type SoundPack } from "@/lib/screens/settings";
import { SOUND_PACK_NAMES, type SoundEvent } from "@/lib/sounds";

/**
 * The sounds of every pack as MP3 files, to download from `/stripe-notification-sound`. Screens
 * synthesize their sounds live; these are rendered from the same code by
 * `scripts/render-sounds.ts` into `public/sounds/<pack>/<event>.mp3`.
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
  /** Where the file is served, e.g. `/sounds/register/payment.mp3`. */
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
    url: `/sounds/${pack}/${event}.mp3`,
    fileName: `saas-monitor-${slug(SOUND_PACK_NAMES[pack])}-${slug(SOUND_EVENT_LABELS[event])}.mp3`,
    title: `${SOUND_PACK_NAMES[pack]} · ${SOUND_EVENT_LABELS[event]}`,
  };
}

/** Every file, pack by pack. */
export const SOUND_FILES: readonly SoundFile[] = SOUND_PACKS.flatMap((pack) =>
  SOUND_EVENTS.map((event) => soundFile(pack, event)),
);

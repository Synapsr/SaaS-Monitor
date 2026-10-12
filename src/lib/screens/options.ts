/**
 * What a screen can be set to, without validating it: constants, types and checks light enough for
 * any bundle, such as the public site's sound board, which Zod would double. `settings.ts` builds
 * the settings' schema on them, and re-exports them.
 */

export const SOUND_PACKS = ["register", "chime", "arcade"] as const;
/** Preset accents. A screen may also use a custom color (`#rrggbb`). */
export const ACCENTS = ["emerald", "violet", "sky", "amber", "rose"] as const;
export const THEMES = ["dark", "light"] as const;
/** Languages a screen speaks. Its numbers and dates follow the language's conventions too. */
export const LANGUAGES = ["en", "fr", "de", "es", "it", "pt", "nl"] as const;
/** How a screen names customers without a name, when it shows names: by their email, or not. */
export const CUSTOMER_EMAILS = ["hidden", "masked", "full"] as const;
/** `all` starts with the first MRR movement of the screen's accounts. */
export const CHART_RANGES = ["30d", "90d", "12m", "all"] as const;
/** The recurring revenue a screen shows: monthly (MRR) or annual (ARR, twelve times MRR). */
export const METRICS = ["mrr", "arr"] as const;

/** Highest goal a screen accepts, in major units. */
export const MAX_GOAL = 1_000_000_000;
/** How long each account may stay on a screen that rotates between them, in seconds. */
export const ROTATION_SECONDS = { min: 5, max: 300 } as const;
/** How long a moment (a sale, a new customer…) may stay on screen, in seconds. */
export const MOMENT_SECONDS = { min: 3, max: 60 } as const;
/** Longest phrase a founder may write for a voice: a sentence, said in a few seconds. */
export const PHRASE_MAX_LENGTH = 160;
/** Phrases a founder may write for an announcement, one of them said at random. */
export const MAX_PHRASES = 5;

export type SoundPack = (typeof SOUND_PACKS)[number];
export type PresetAccent = (typeof ACCENTS)[number];
/** A custom accent: a hex color in lowercase, e.g. `#ff6b35`. */
export type CustomAccent = `#${string}`;
export type Accent = PresetAccent | CustomAccent;
export type Theme = (typeof THEMES)[number];
export type Language = (typeof LANGUAGES)[number];
export type ChartRange = (typeof CHART_RANGES)[number];
export type Metric = (typeof METRICS)[number];
export type CustomerEmails = (typeof CUSTOMER_EMAILS)[number];

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Whether `value` is a custom accent: `#` and six hex digits, in any case. */
export function isCustomAccent(value: string): value is CustomAccent {
  return HEX_COLOR.test(value);
}

/**
 * Whether `value` is an IANA time zone this runtime knows, e.g. `Europe/Paris`, aliases included:
 * browsers may report `Asia/Calcutta`, which `Intl.supportedValuesOf` may not list. Offsets are
 * refused: ICU reads `+05:30`, `+0530` and `+05` alike, while MySQL's `CONVERT_TZ`, which buckets
 * days, only reads the first. Names never start with a sign.
 */
export function isTimeZone(value: string): boolean {
  if (!/^[a-z]/i.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

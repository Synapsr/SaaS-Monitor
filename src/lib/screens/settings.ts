import { z } from "zod";

export const SOUND_PACKS = ["register", "chime", "arcade"] as const;
/** Preset accents. A screen may also use a custom color (`#rrggbb`). */
export const ACCENTS = ["emerald", "violet", "sky", "amber", "rose"] as const;
export const THEMES = ["dark", "light"] as const;
/** Languages a screen speaks. Its numbers and dates follow the language's conventions too. */
export const LANGUAGES = ["en", "fr", "de", "es", "it", "pt", "nl"] as const;
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

export type SoundPack = (typeof SOUND_PACKS)[number];
export type PresetAccent = (typeof ACCENTS)[number];
/** A custom accent: a hex color in lowercase, e.g. `#ff6b35`. */
export type CustomAccent = `#${string}`;
export type Accent = PresetAccent | CustomAccent;
export type Theme = (typeof THEMES)[number];
export type Language = (typeof LANGUAGES)[number];
export type ChartRange = (typeof CHART_RANGES)[number];
export type Metric = (typeof METRICS)[number];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Whether `value` is a custom accent: `#` and six hex digits, in any case. */
export function isCustomAccent(value: string): value is CustomAccent {
  return HEX_COLOR.test(value);
}

const customAccentSchema = z
  .string()
  .regex(HEX_COLOR, "Use a hex color such as #ff6b35")
  .transform((value) => value.toLowerCase() as CustomAccent);

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

/**
 * Everything a founder can tune on a screen. Stored as JSON on `screens.settings`, so new fields
 * must come with a default: existing screens pick it up without a migration.
 */
export const screenSettingsSchema = z.object({
  /** ISO 4217 code, lowercase like Stripe. Every amount on the screen is converted to it. */
  currency: z
    .string()
    .regex(/^[a-z]{3}$/, "Use a 3-letter currency code")
    .default("usd"),
  /** IANA time zone that defines "today" and "this month". */
  timeZone: z.string().refine(isTimeZone, "Unknown time zone").default("UTC"),
  /**
   * The screen's main metric. Display states stay in MRR: a screen showing ARR multiplies every
   * recurring figure by twelve as it presents them (`src/lib/display/metric.ts`).
   */
  metric: z.enum(METRICS).default("mrr"),
  /**
   * Target of `metric` in major units (e.g. 10000 for $10k MRR, or 1000000 for $1M ARR). `null`
   * follows the milestone ladder.
   */
  goal: z.number().int().positive().max(MAX_GOAL).nullable().default(null),
  sound: z
    .object({
      enabled: z.boolean().default(true),
      pack: z.enum(SOUND_PACKS).default("register"),
      volume: z.number().min(0).max(1).default(0.7),
      onPayment: z.boolean().default(true),
      onMrrUp: z.boolean().default(true),
      onMrrDown: z.boolean().default(true),
      /** A Stripe customer created, paying or not: often a sign-up. */
      onCustomer: z.boolean().default(true),
    })
    .prefault({}),
  /** Confetti on new revenue and a full-screen moment when a milestone is crossed. */
  celebrations: z.boolean().default(true),
  /**
   * How long the moment of each event stays on screen: long enough to be read from across the
   * room. Shorter when others are waiting.
   */
  momentSeconds: z.number().int().min(MOMENT_SECONDS.min).max(MOMENT_SECONDS.max).default(10),
  /** Customer names are hidden by default: the screen URL may be seen by visitors. */
  showCustomerNames: z.boolean().default(false),
  chartRange: z.enum(CHART_RANGES).default("90d"),
  accent: z.union([z.enum(ACCENTS), customAccentSchema]).default("emerald"),
  theme: z.enum(THEMES).default("dark"),
  language: z.enum(LANGUAGES).default("en"),
  /**
   * With several Stripe accounts (several products, often), each can take its turn on screen with
   * its own numbers, instead of one combined total. Moments name the account they come from.
   */
  rotation: z
    .object({
      enabled: z.boolean().default(false),
      /** How long each account stays on screen. */
      seconds: z.number().int().min(ROTATION_SECONDS.min).max(ROTATION_SECONDS.max).default(15),
      /** The combined total takes a turn as well. */
      includeTotal: z.boolean().default(true),
    })
    .prefault({}),
});

export type ScreenSettings = z.infer<typeof screenSettingsSchema>;
export type ScreenSettingsInput = z.input<typeof screenSettingsSchema>;

export const defaultScreenSettings: ScreenSettings = screenSettingsSchema.parse({});

/**
 * Reads settings stored by any past version: sections that no longer validate are reset to their
 * defaults instead of breaking the screen.
 */
export function parseScreenSettings(value: unknown): ScreenSettings {
  const result = screenSettingsSchema.safeParse(value);
  if (result.success) return result.data;

  const input: Record<string, unknown> =
    typeof value === "object" && value !== null ? { ...value } : {};
  for (const issue of result.error.issues) {
    const section = issue.path[0];
    if (typeof section === "string") delete input[section];
  }
  return screenSettingsSchema.safeParse(input).data ?? defaultScreenSettings;
}

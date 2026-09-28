import { z } from "zod";

export const SOUND_PACKS = ["register", "chime", "arcade"] as const;
export const ACCENTS = ["emerald", "violet", "sky", "amber", "rose"] as const;
export const CHART_RANGES = ["30d", "90d", "12m"] as const;
/** The recurring revenue a screen shows: monthly (MRR) or annual (ARR, twelve times MRR). */
export const METRICS = ["mrr", "arr"] as const;

/** Highest goal a screen accepts, in major units. */
export const MAX_GOAL = 1_000_000_000;

export type SoundPack = (typeof SOUND_PACKS)[number];
export type Accent = (typeof ACCENTS)[number];
export type ChartRange = (typeof CHART_RANGES)[number];
export type Metric = (typeof METRICS)[number];

/**
 * Whether `value` is an IANA time zone this runtime knows, e.g. `Europe/Paris`, aliases included:
 * browsers may report `Asia/Calcutta`, which `Intl.supportedValuesOf` may not list. Offsets such as
 * `+05:30` are refused: ICU reads them as UTC+05:30, PostgreSQL's `AT TIME ZONE`, which buckets
 * days, as UTC−05:30 (POSIX signs). Names never start with a sign.
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
    })
    .prefault({}),
  /** Confetti on new revenue and a full-screen moment when a milestone is crossed. */
  celebrations: z.boolean().default(true),
  /** Customer names are hidden by default: the screen URL may be seen by visitors. */
  showCustomerNames: z.boolean().default(false),
  chartRange: z.enum(CHART_RANGES).default("90d"),
  accent: z.enum(ACCENTS).default("emerald"),
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

import {
  ACCENTS,
  CHART_RANGES,
  isCustomAccent,
  isTimeZone,
  LANGUAGES,
  METRICS,
  SOUND_PACKS,
  THEMES,
  type Accent,
  type ChartRange,
  type Language,
  type Metric,
  type SoundPack,
  type Theme,
} from "@/lib/screens/settings";

/** What a visitor can change on the demo screen, through its query string. */
export interface DemoOptions {
  accent: Accent;
  theme: Theme;
  language: Language;
  /** `null` mutes the demo (`?sound=off`). */
  soundPack: SoundPack | null;
  showCustomerNames: boolean;
  chartRange: ChartRange;
  metric: Metric;
  timeZone: string;
  /** Stripe accounts on the demo screen: two products (`?accounts=2`) show the rotation. */
  accounts: 1 | 2;
  /** Several accounts take turns on screen, unless `?rotate=0` adds them up. */
  rotation: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Reads `/d/demo?accent=violet&theme=light&lang=fr&sound=arcade&names=1&range=12m&metric=arr&tz=Europe/Paris&preview=1`.
 * `accent` may also be a hex color, with or without its `#` (`accent=ff6b35`). `accounts=2` shows two
 * products, taking turns on screen unless `rotate=0`.
 */
export function parseDemoOptions(params: SearchParams): { options: DemoOptions; preview: boolean } {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const oneOf = <T extends string>(values: readonly T[], value: string | undefined) =>
    values.find((candidate) => candidate === value);

  const sound = read("sound");
  const timeZone = read("tz");
  const accent = read("accent");
  const hex = accent && `#${accent.replace(/^#/, "").toLowerCase()}`;
  return {
    options: {
      accent: oneOf(ACCENTS, accent) ?? (hex && isCustomAccent(hex) ? hex : "emerald"),
      theme: oneOf(THEMES, read("theme")) ?? "dark",
      language: oneOf(LANGUAGES, read("lang")) ?? "en",
      soundPack: sound === "off" ? null : (oneOf(SOUND_PACKS, sound) ?? "register"),
      showCustomerNames: read("names") === "1",
      chartRange: oneOf(CHART_RANGES, read("range")) ?? "90d",
      metric: oneOf(METRICS, read("metric")) ?? "mrr",
      timeZone: timeZone && isTimeZone(timeZone) ? timeZone : "America/New_York",
      accounts: read("accounts") === "2" ? 2 : 1,
      rotation: read("rotate") !== "0",
    },
    preview: read("preview") === "1",
  };
}

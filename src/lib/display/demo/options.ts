import {
  ACCENTS,
  CHART_RANGES,
  isTimeZone,
  SOUND_PACKS,
  type Accent,
  type ChartRange,
  type SoundPack,
} from "@/lib/screens/settings";

/** What a visitor can change on the demo screen, through its query string. */
export interface DemoOptions {
  accent: Accent;
  /** `null` mutes the demo (`?sound=off`). */
  soundPack: SoundPack | null;
  showCustomerNames: boolean;
  chartRange: ChartRange;
  timeZone: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Reads `/d/demo?accent=violet&sound=arcade&names=1&range=12m&tz=Europe/Paris&preview=1`. */
export function parseDemoOptions(params: SearchParams): { options: DemoOptions; preview: boolean } {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const oneOf = <T extends string>(values: readonly T[], value: string | undefined) =>
    values.find((candidate) => candidate === value);

  const sound = read("sound");
  const timeZone = read("tz");
  return {
    options: {
      accent: oneOf(ACCENTS, read("accent")) ?? "emerald",
      soundPack: sound === "off" ? null : (oneOf(SOUND_PACKS, sound) ?? "register"),
      showCustomerNames: read("names") === "1",
      chartRange: oneOf(CHART_RANGES, read("range")) ?? "90d",
      timeZone: timeZone && isTimeZone(timeZone) ? timeZone : "America/New_York",
    },
    preview: read("preview") === "1",
  };
}

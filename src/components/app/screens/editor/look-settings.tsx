"use client";

import { MoonIcon, SunIcon, type LucideIcon } from "lucide-react";
import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { recurringMetric } from "@/lib/display/metric";
import {
  CHART_RANGES,
  THEMES,
  type ChartRange,
  type Metric,
  type ScreenSettings,
  type Theme,
} from "@/lib/screens/settings";
import { AccentPicker, accentName } from "./accent-picker";
import { SettingRow } from "./settings-section";

const THEME_OPTIONS: Record<Theme, { label: string; icon: LucideIcon }> = {
  dark: { label: "Dark", icon: MoonIcon },
  light: { label: "Light", icon: SunIcon },
};

const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
  all: "All time",
};

type LookSettingsValue = Pick<
  ScreenSettings,
  "theme" | "accent" | "chartRange" | "celebrations" | "showCustomerNames"
>;

export function LookSettings({
  settings,
  metric,
  onChange,
}: {
  settings: LookSettingsValue;
  /** The chart shows it: the "MRR chart" or the "ARR chart". */
  metric: Metric;
  onChange: (patch: Partial<LookSettingsValue>) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <p id={`${id}-theme`} className="text-sm font-medium">
          Theme
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={settings.theme}
          onValueChange={(theme) => theme && onChange({ theme: theme as Theme })}
          aria-labelledby={`${id}-theme`}
        >
          {THEMES.map((theme) => {
            const { label, icon: Icon } = THEME_OPTIONS[theme];
            return (
              <ToggleGroupItem key={theme} value={theme} className="px-3">
                <Icon data-icon="inline-start" />
                {label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-sm font-medium">
          <span id={`${id}-accent`}>Accent color</span>{" "}
          <span aria-hidden="true" className="font-normal text-muted-foreground">
            · {accentName(settings.accent)}
          </span>
        </p>
        <AccentPicker
          accent={settings.accent}
          onChange={(accent) => onChange({ accent })}
          labelledBy={`${id}-accent`}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <p id={`${id}-range`} className="text-sm font-medium">
          {recurringMetric(metric).label} chart
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={settings.chartRange}
          onValueChange={(range) => range && onChange({ chartRange: range as ChartRange })}
          aria-labelledby={`${id}-range`}
        >
          {CHART_RANGES.map((range) => (
            <ToggleGroupItem key={range} value={range} className="px-3">
              {CHART_RANGE_LABELS[range]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <SettingRow
        htmlFor={`${id}-celebrations`}
        label="Celebrations"
        description="Confetti for new revenue, and a full-screen moment when you pass a milestone."
      >
        <Switch
          id={`${id}-celebrations`}
          checked={settings.celebrations}
          onCheckedChange={(celebrations) => onChange({ celebrations })}
        />
      </SettingRow>

      <SettingRow
        htmlFor={`${id}-names`}
        label="Show customer names"
        description="Anyone who can see the screen sees who pays you. Keep it off in shared spaces."
      >
        <Switch
          id={`${id}-names`}
          checked={settings.showCustomerNames}
          onCheckedChange={(showCustomerNames) => onChange({ showCustomerNames })}
        />
      </SettingRow>
    </div>
  );
}

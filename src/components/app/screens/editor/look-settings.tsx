"use client";

import { CheckIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ACCENT_PALETTES } from "@/lib/display/accents";
import { recurringMetric } from "@/lib/display/metric";
import {
  ACCENTS,
  CHART_RANGES,
  type Accent,
  type ChartRange,
  type Metric,
  type ScreenSettings,
} from "@/lib/screens/settings";
import { SettingRow } from "./settings-section";

const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
  all: "All time",
};

type LookSettingsValue = Pick<
  ScreenSettings,
  "accent" | "chartRange" | "celebrations" | "showCustomerNames"
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
        <p className="text-sm font-medium">
          <span id={`${id}-accent`}>Accent color</span>{" "}
          <span aria-hidden="true" className="font-normal text-muted-foreground">
            · {ACCENT_PALETTES[settings.accent].label}
          </span>
        </p>
        <RadioGroupPrimitive.Root
          value={settings.accent}
          onValueChange={(accent) => onChange({ accent: accent as Accent })}
          aria-labelledby={`${id}-accent`}
          className="flex flex-wrap gap-3"
        >
          {ACCENTS.map((accent) => (
            <RadioGroupPrimitive.Item
              key={accent}
              value={accent}
              aria-label={ACCENT_PALETTES[accent].label}
              style={{ backgroundColor: ACCENT_PALETTES[accent].base }}
              className="relative flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow outline-none after:absolute after:-inset-1 focus-visible:ring-3 focus-visible:ring-ring/60 data-[state=checked]:ring-2 data-[state=checked]:ring-foreground"
            >
              <RadioGroupPrimitive.Indicator>
                <CheckIcon className="size-4 text-black/75" strokeWidth={3} />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
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

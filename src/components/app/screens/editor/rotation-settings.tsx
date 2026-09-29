"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScreenSettings } from "@/lib/screens/settings";
import { ChoiceCard } from "./choice-card";
import { SettingRow } from "./settings-section";

type Rotation = ScreenSettings["rotation"];

/** Turns long enough to read a screen from across the room, short enough to see them all. */
const TURNS = [10, 15, 30, 60] as const;

const TOGETHER = "together";
const IN_TURN = "in-turn";

/** How a screen shows several Stripe accounts: added up, or each in turn. */
export function RotationSettings({
  rotation,
  onChange,
}: {
  rotation: Rotation;
  onChange: (patch: Partial<Rotation>) => void;
}) {
  const id = useId();
  // A duration saved by hand elsewhere still shows, as the closest turn offered.
  const seconds = TURNS.reduce((closest, turn) =>
    Math.abs(turn - rotation.seconds) < Math.abs(closest - rotation.seconds) ? turn : closest,
  );
  return (
    <div className="flex flex-col gap-6">
      <RadioGroupPrimitive.Root
        value={rotation.enabled ? IN_TURN : TOGETHER}
        onValueChange={(value) => onChange({ enabled: value === IN_TURN })}
        aria-label="How accounts show"
        className="grid gap-2 sm:grid-cols-2"
      >
        <ChoiceCard value={TOGETHER} title="Added up" hint="One total for every account." />
        <ChoiceCard
          value={IN_TURN}
          title="One at a time"
          hint="Each account on its own, in turn."
        />
      </RadioGroupPrimitive.Root>

      {rotation.enabled && (
        <>
          <div className="flex flex-col gap-2.5">
            <p id={`${id}-seconds`} className="text-sm font-medium">
              Next account every
            </p>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={String(seconds)}
              onValueChange={(value) => value && onChange({ seconds: Number(value) })}
              aria-labelledby={`${id}-seconds`}
            >
              {TURNS.map((turn) => (
                <ToggleGroupItem key={turn} value={String(turn)} className="px-3">
                  {turn < 60 ? `${turn} s` : "1 min"}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <SettingRow
            htmlFor={`${id}-total`}
            label="Show the total too"
            description="All accounts added up takes a turn as well."
          >
            <Switch
              id={`${id}-total`}
              checked={rotation.includeTotal}
              onCheckedChange={(includeTotal) => onChange({ includeTotal })}
            />
          </SettingRow>
          <p className="text-sm text-pretty text-muted-foreground">
            When something happens, the screen shows its account right away, and its moment names
            it.
          </p>
        </>
      )}
    </div>
  );
}

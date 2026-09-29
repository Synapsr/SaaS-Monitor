"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { recurringMetric, type RecurringMetric } from "@/lib/display/metric";
import {
  SOUND_PACKS,
  type Metric,
  type ScreenSettings,
  type SoundPack,
} from "@/lib/screens/settings";
import { playSound, SOUND_PACK_NAMES, unlockAudio, type SoundEvent } from "@/lib/sounds";
import { ChoiceCard } from "./choice-card";
import { PreviewButton } from "./preview-button";
import { SettingRow } from "./settings-section";
import { VolumeSlider } from "./volume-slider";

type Sound = ScreenSettings["sound"];

const PACK_HINTS: Record<SoundPack, string> = {
  register: "Ka-ching!",
  chime: "Soft and calm",
  arcade: "8-bit coins",
};

/** Recurring revenue events are named after the screen's metric: "ARR goes up". */
const EVENTS = [
  {
    key: "onPayment",
    event: "payment",
    label: () => "Payment received",
    description: "Every successful charge.",
  },
  {
    key: "onCustomer",
    event: "customer",
    label: () => "New customer",
    description: "Created in Stripe, often at sign-up, before they pay.",
  },
  {
    key: "onMrrUp",
    event: "mrrUp",
    label: (metric) => `${metric} goes up`,
    description: "New subscription, upgrade or reactivation.",
  },
  {
    key: "onMrrDown",
    event: "mrrDown",
    label: (metric) => `${metric} goes down`,
    description: "Downgrade or cancellation.",
  },
] as const satisfies readonly {
  key: keyof Sound;
  event: SoundEvent;
  label: (metric: RecurringMetric["label"]) => string;
  description: string;
}[];

/** Plays a sound from a click: browsers only allow audio after a user gesture. */
function preview(event: SoundEvent, pack: SoundPack, volume: number) {
  void unlockAudio().then(() => playSound(event, { pack, volume }));
}

export function SoundSettings({
  sound,
  metric,
  onChange,
}: {
  sound: Sound;
  metric: Metric;
  onChange: (patch: Partial<Sound>) => void;
}) {
  const id = useId();
  const metricLabel = recurringMetric(metric).label;

  return (
    <div className="flex flex-col gap-6">
      <SettingRow
        htmlFor={`${id}-enabled`}
        label="Play sounds"
        description="The TV needs speakers, or a sound bar, turned on."
      >
        <Switch
          id={`${id}-enabled`}
          checked={sound.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
        />
      </SettingRow>

      {/* A disabled fieldset turns every control inside off at once. */}
      <fieldset
        disabled={!sound.enabled}
        aria-label="Sound options"
        className="flex flex-col gap-6 transition-opacity disabled:opacity-50"
      >
        <div className="flex flex-col gap-2">
          <p id={`${id}-pack`} className="text-sm font-medium">
            Sound pack
          </p>
          <RadioGroupPrimitive.Root
            value={sound.pack}
            onValueChange={(pack) => onChange({ pack: pack as SoundPack })}
            disabled={!sound.enabled}
            aria-labelledby={`${id}-pack`}
            className="grid gap-2 sm:grid-cols-3"
          >
            {SOUND_PACKS.map((pack) => (
              <div key={pack} className="relative">
                <ChoiceCard
                  value={pack}
                  title={SOUND_PACK_NAMES[pack]}
                  hint={PACK_HINTS[pack]}
                  className="pr-10"
                />
                <div className="absolute top-2 right-2">
                  <PreviewButton
                    label={SOUND_PACK_NAMES[pack]}
                    disabled={!sound.enabled}
                    onClick={() => preview("payment", pack, sound.volume)}
                  />
                </div>
              </div>
            ))}
          </RadioGroupPrimitive.Root>
        </div>

        <VolumeSlider
          volume={sound.volume}
          disabled={!sound.enabled}
          onChange={(volume) => onChange({ volume })}
          onCommit={(volume) => preview("payment", sound.pack, volume)}
        />

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">Play a sound when</p>
          {EVENTS.map(({ key, event, label: labelFor, description }) => {
            const label = labelFor(metricLabel);
            return (
              <SettingRow
                key={key}
                htmlFor={`${id}-${key}`}
                label={label}
                description={description}
              >
                <PreviewButton
                  label={label}
                  disabled={!sound.enabled}
                  onClick={() => preview(event, sound.pack, sound.volume)}
                />
                <Switch
                  id={`${id}-${key}`}
                  checked={sound[key]}
                  disabled={!sound.enabled}
                  onCheckedChange={(checked) => onChange({ [key]: checked })}
                />
              </SettingRow>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

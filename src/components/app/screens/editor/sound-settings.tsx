"use client";

import { PlayIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive, Slider as SliderPrimitive } from "radix-ui";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SOUND_PACKS, type ScreenSettings, type SoundPack } from "@/lib/screens/settings";
import { playSound, unlockAudio, type SoundEvent } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { SettingRow } from "./settings-section";

type Sound = ScreenSettings["sound"];

const PACKS: Record<SoundPack, { label: string; hint: string }> = {
  register: { label: "Cash register", hint: "Ka-ching!" },
  chime: { label: "Chime", hint: "Soft and calm" },
  arcade: { label: "Arcade", hint: "8-bit coins" },
};

const EVENTS = [
  {
    key: "onPayment",
    event: "payment",
    label: "Payment received",
    description: "Every successful charge.",
  },
  {
    key: "onMrrUp",
    event: "mrrUp",
    label: "MRR goes up",
    description: "New subscription, upgrade or reactivation.",
  },
  {
    key: "onMrrDown",
    event: "mrrDown",
    label: "MRR goes down",
    description: "Downgrade or cancellation.",
  },
] as const satisfies readonly {
  key: keyof Sound;
  event: SoundEvent;
  label: string;
  description: string;
}[];

/** Plays a sound from a click: browsers only allow audio after a user gesture. */
function preview(event: SoundEvent, pack: SoundPack, volume: number) {
  void unlockAudio().then(() => playSound(event, { pack, volume }));
}

function PreviewButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Play ${label}`}
      onClick={onClick}
      disabled={disabled}
      className="text-muted-foreground"
    >
      {/* The triangle's visual center sits right of its box: nudge it. */}
      <PlayIcon className="size-3.5 translate-x-px fill-current" />
    </Button>
  );
}

export function SoundSettings({
  sound,
  onChange,
}: {
  sound: Sound;
  onChange: (patch: Partial<Sound>) => void;
}) {
  const id = useId();
  const volumePercent = Math.round(sound.volume * 100);

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
                <RadioGroupPrimitive.Item
                  value={pack}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-lg p-3 pr-10 text-left ring-1 ring-border transition-[box-shadow,background-color] outline-none",
                    "hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none",
                    "data-[state=checked]:bg-muted/40 data-[state=checked]:ring-2 data-[state=checked]:ring-foreground",
                  )}
                >
                  <span className="text-sm font-medium">{PACKS[pack].label}</span>
                  <span className="text-xs text-muted-foreground">{PACKS[pack].hint}</span>
                </RadioGroupPrimitive.Item>
                <div className="absolute top-2 right-2">
                  <PreviewButton
                    label={PACKS[pack].label}
                    disabled={!sound.enabled}
                    onClick={() => preview("payment", pack, sound.volume)}
                  />
                </div>
              </div>
            ))}
          </RadioGroupPrimitive.Root>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span id={`${id}-volume`} className="text-sm font-medium">
              Volume
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">{volumePercent}%</span>
          </div>
          <SliderPrimitive.Root
            name="volume"
            min={0}
            max={100}
            step={5}
            value={[volumePercent]}
            disabled={!sound.enabled}
            onValueChange={([percent]) => onChange({ volume: percent / 100 })}
            // Letting go of the slider plays a sample at the new volume.
            onValueCommit={([percent]) => preview("payment", sound.pack, percent / 100)}
            className="relative flex h-5 w-full touch-none items-center select-none data-disabled:opacity-50"
          >
            <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-muted">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            {/* Radix gives the slider role to the thumb: that's where its name goes. */}
            <SliderPrimitive.Thumb
              aria-labelledby={`${id}-volume`}
              aria-valuetext={`${volumePercent}%`}
              className="relative block size-4 rounded-full border border-ring bg-white shadow-sm ring-ring/50 transition-[box-shadow] after:absolute after:-inset-3 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden"
            />
          </SliderPrimitive.Root>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">Play a sound when</p>
          {EVENTS.map(({ key, event, label, description }) => (
            <SettingRow key={key} htmlFor={`${id}-${key}`} label={label} description={description}>
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
          ))}
        </div>
      </fieldset>
    </div>
  );
}

"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import { useId } from "react";

/** A volume from 0 to 1, in steps of 5%, with its percentage. Letting go plays a sample. */
export function VolumeSlider({
  volume,
  disabled,
  onChange,
  onCommit,
}: {
  volume: number;
  disabled: boolean;
  onChange: (volume: number) => void;
  onCommit: (volume: number) => void;
}) {
  const id = useId();
  const percent = Math.round(volume * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span id={id} className="text-sm font-medium">
          Volume
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">{percent}%</span>
      </div>
      <SliderPrimitive.Root
        name="volume"
        min={0}
        max={100}
        step={5}
        value={[percent]}
        disabled={disabled}
        onValueChange={([value]) => onChange(value / 100)}
        onValueCommit={([value]) => onCommit(value / 100)}
        className="relative flex h-5 w-full touch-none items-center select-none data-disabled:opacity-50"
      >
        <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {/* Radix gives the slider role to the thumb: that's where its name goes. */}
        <SliderPrimitive.Thumb
          aria-labelledby={id}
          aria-valuetext={`${percent}%`}
          className="relative block size-4 rounded-full border border-ring bg-white shadow-sm ring-ring/50 transition-[box-shadow] after:absolute after:-inset-3 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden"
        />
      </SliderPrimitive.Root>
    </div>
  );
}

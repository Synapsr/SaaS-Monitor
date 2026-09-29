"use client";

import { CheckIcon, PipetteIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId, useState } from "react";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { accentSwatch, PRESET_ACCENTS } from "@/lib/display/accents";
import {
  ACCENTS,
  isCustomAccent,
  type Accent,
  type CustomAccent,
  type PresetAccent,
} from "@/lib/screens/settings";
import { cn } from "@/lib/utils";
import { parseColor } from "./parse-color";

/** Offered when a screen picks a custom color for the first time. */
const FIRST_CUSTOM_COLOR: CustomAccent = "#ff6b35";
const CUSTOM = "custom";

const SWATCH =
  "relative flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow outline-none after:absolute after:-inset-1 focus-visible:ring-3 focus-visible:ring-ring/60 data-[state=checked]:ring-2 data-[state=checked]:ring-foreground";

/** The accent's name, shown next to the setting's label. */
export function accentName(accent: Accent): string {
  return isCustomAccent(accent) ? `Custom ${accent}` : PRESET_ACCENTS[accent].label;
}

/**
 * The preset accents, and a custom color picked with the system's color picker or pasted as hex,
 * e.g. a brand color. Custom colors are made lighter or darker on screen if they would not read
 * well on its theme.
 */
export function AccentPicker({
  accent,
  onChange,
  labelledBy,
}: {
  accent: Accent;
  onChange: (accent: Accent) => void;
  labelledBy: string;
}) {
  const custom = isCustomAccent(accent) ? accent : null;
  // Switching back to a preset and then to custom again brings back the color picked before.
  const [lastCustom, setLastCustom] = useState<CustomAccent>(custom ?? FIRST_CUSTOM_COLOR);
  const [open, setOpen] = useState(false);

  const pickCustom = (color: CustomAccent) => {
    setLastCustom(color);
    onChange(color);
  };

  return (
    <RadioGroupPrimitive.Root
      value={custom ? CUSTOM : accent}
      onValueChange={(value) => {
        if (value === CUSTOM) {
          onChange(lastCustom);
          setOpen(true);
        } else {
          onChange(value as PresetAccent);
        }
      }}
      aria-labelledby={labelledBy}
      className="flex flex-wrap gap-3"
    >
      {ACCENTS.map((preset) => (
        <RadioGroupPrimitive.Item
          key={preset}
          value={preset}
          aria-label={PRESET_ACCENTS[preset].label}
          style={{ backgroundColor: accentSwatch(preset) }}
          className={SWATCH}
        >
          <RadioGroupPrimitive.Indicator>
            <CheckIcon className="size-4 text-black/75" strokeWidth={3} />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <RadioGroupPrimitive.Item
            value={CUSTOM}
            aria-label="Custom color"
            // Until one is picked, a color wheel says "any color".
            style={
              custom
                ? { backgroundColor: custom }
                : {
                    backgroundImage:
                      "conic-gradient(#f87171, #fbbf24, #34d399, #38bdf8, #a78bfa, #f472b6, #f87171)",
                  }
            }
            className={SWATCH}
          >
            {custom ? (
              <RadioGroupPrimitive.Indicator>
                <PipetteIcon
                  className="size-3.5 text-white mix-blend-difference"
                  strokeWidth={2.5}
                />
              </RadioGroupPrimitive.Indicator>
            ) : null}
          </RadioGroupPrimitive.Item>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <CustomColorField value={custom ?? lastCustom} onChange={pickCustom} />
        </PopoverContent>
      </Popover>
    </RadioGroupPrimitive.Root>
  );
}

function CustomColorField({
  value,
  onChange,
}: {
  value: CustomAccent;
  onChange: (color: CustomAccent) => void;
}) {
  const id = useId();
  // What is typed may not be a color yet: the screen keeps the last valid one meanwhile.
  const [input, setInput] = useState<string>(value);
  const invalid = input.trim() !== "" && parseColor(input) === null;

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={`${id}-hex`} className="text-sm font-medium">
        Custom color
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          aria-label="Pick a color"
          onChange={(event) => {
            const color = parseColor(event.target.value);
            if (!color) return;
            setInput(color);
            onChange(color);
          }}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <Input
          id={`${id}-hex`}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            const color = parseColor(event.target.value);
            if (color) onChange(color);
          }}
          onBlur={() => {
            const color = parseColor(input);
            if (color) setInput(color);
          }}
          placeholder={FIRST_CUSTOM_COLOR}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          className={cn("h-9 font-mono", invalid && "text-destructive")}
        />
      </div>
      {invalid ? (
        <FieldError id={`${id}-hint`}>Paste a hex color, such as #ff6b35.</FieldError>
      ) : (
        <p id={`${id}-hint`} className="text-xs text-pretty text-muted-foreground">
          Paste your brand color. The screen makes it lighter or darker if it needs to, so that it
          stays readable.
        </p>
      )}
    </div>
  );
}

"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * An option of a radio group drawn as a card, with a title and a hint: for choices that need a
 * word of explanation, such as a sound pack. Outlined when chosen.
 */
export function ChoiceCard({
  value,
  title,
  hint,
  className,
}: {
  value: string;
  title: string;
  hint: string;
  className?: string;
}) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-lg p-3 text-left ring-1 ring-border transition-[box-shadow,background-color] outline-none",
        "hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none",
        "data-[state=checked]:bg-muted/40 data-[state=checked]:ring-2 data-[state=checked]:ring-foreground",
        className,
      )}
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </RadioGroupPrimitive.Item>
  );
}

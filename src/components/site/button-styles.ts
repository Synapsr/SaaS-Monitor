import { cn } from "@/lib/utils";

/**
 * The site's buttons, as classes for links and buttons alike: pills that press in (scale 0.96)
 * and whose icon side is a little tighter, so that the label looks centered.
 */
const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap outline-none transition-[background-color,box-shadow,color,scale] duration-150 ease-out select-none active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-(--glow) focus-visible:ring-offset-2 focus-visible:ring-offset-(--screen) [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANTS = {
  /** The one thing to do: light on the dark stage. */
  primary: "bg-(--ink) text-(--screen) shadow-(--shadow-primary) hover:bg-(--ink-bright)",
  /** Another way in, quieter. */
  secondary:
    "bg-(--surface-raised) text-(--ink) shadow-(--edge) hover:bg-(--surface-hover) hover:shadow-(--edge-hover)",
  /** A link that looks like one only on hover. */
  ghost: "text-(--ink-2) hover:bg-(--surface-raised) hover:text-(--ink)",
} as const;

const SIZES = {
  lg: "h-12 px-6 text-[0.95rem] has-[>svg:first-child]:pl-[1.375rem] has-[>svg:last-child]:pr-[1.375rem]",
  md: "h-10 px-4.5 text-sm has-[>svg:first-child]:pl-4 has-[>svg:last-child]:pr-4",
  sm: "h-9 px-4 text-sm has-[>svg:first-child]:pl-3.5 has-[>svg:last-child]:pr-3.5",
} as const;

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

/** A link inside a text: underlined softly, lit on hover. */
export const textLinkClass =
  "text-(--ink) underline decoration-(--ink-3)/40 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-(--glow) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)";

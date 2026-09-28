import type { Accent } from "@/lib/screens/settings";
import { cn } from "@/lib/utils";
import { ACCENT_COLORS } from "./accents";

const LINE = "M0 74 C18 72 26 64 40 63 S62 55 76 50 S98 46 110 36 S136 26 160 14";

/**
 * A stylised miniature of a wall display in the screen's accent color. Cheap to render in lists,
 * unlike the live preview which loads the real display.
 */
export function ScreenThumbnail({ accent, className }: { accent: Accent; className?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ "--accent": ACCENT_COLORS[accent] } as React.CSSProperties}
      className={cn(
        "relative aspect-video overflow-hidden bg-neutral-950 outline-1 -outline-offset-1 outline-white/10",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_85%_110%,color-mix(in_oklab,var(--accent)_28%,transparent),transparent_70%)]" />
      <div className="absolute top-[14%] left-[8%] flex w-[40%] flex-col gap-[0.4rem]">
        <span className="h-1 w-1/3 rounded-full bg-white/25" />
        <span className="h-2.5 w-full rounded-full bg-white/85" />
        <span className="h-1 w-1/2 rounded-full bg-(--accent)/70" />
      </div>
      <span className="absolute top-[14%] right-[8%] flex items-center gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-(--accent)" />
        <span className="h-1 w-5 rounded-full bg-white/25" />
      </span>
      <svg
        viewBox="0 0 160 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-3/5 w-full"
      >
        <path d={`${LINE} L160 90 L0 90 Z`} fill="var(--accent)" fillOpacity="0.12" />
        <path
          d={LINE}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

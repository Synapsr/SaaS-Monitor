import { BRAND_COLORS, LOGO_PULSE_PATH } from "@/lib/brand";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

function Pulse({ color }: { color: string }) {
  return (
    <path
      d={LOGO_PULSE_PATH}
      fill="none"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** The app icon (`src/app/icon.svg`): the pulse on a dark tile, in both themes. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("size-7 shrink-0 rounded-[25%] dark:ring-1 dark:ring-white/15", className)}
    >
      <rect width="64" height="64" rx="16" fill={BRAND_COLORS.tile} />
      <Pulse color={BRAND_COLORS.glow} />
    </svg>
  );
}

/** The pulse alone, in the text color: wall displays draw it in their accent. */
export function LogoPulse({ className }: { className?: string }) {
  return (
    <svg viewBox="8 18 48 34" aria-hidden="true" className={cn("shrink-0", className)}>
      <Pulse color="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[0.95rem] font-semibold tracking-tight">{siteConfig.name}</span>
    </span>
  );
}

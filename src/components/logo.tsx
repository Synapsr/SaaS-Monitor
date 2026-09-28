import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/** The app icon (`src/app/icon.svg`): a pulse line on a dark tile, in both themes. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("size-7 shrink-0 rounded-[25%] dark:ring-1 dark:ring-white/15", className)}
    >
      <rect width="64" height="64" rx="16" fill="#0a0a0a" />
      <path
        d="M12 40h9l6-16 8 24 6-14h11"
        fill="none"
        stroke="#34d399"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

import { LogoPulse } from "@/components/logo";
import { cn } from "@/lib/utils";

/** The hosted product's address, as it should read on a photo of the wall. */
const DOMAIN = "saas-monitor.com";

/**
 * A quiet credit under moments and milestones, the parts of a screen that get filmed and shared.
 * Hidden from screen readers: the moment it sits under is announced without it.
 */
export function Attribution({ className }: { className?: string }) {
  return (
    <p
      aria-hidden
      className={cn(
        "flex items-center gap-[0.45em] font-medium tracking-tight whitespace-nowrap text-(--ink-3)",
        className,
      )}
    >
      <LogoPulse className="h-[0.7em]" />
      {DOMAIN}
    </p>
  );
}

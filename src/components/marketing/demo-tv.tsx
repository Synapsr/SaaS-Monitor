import { DisplayFrame } from "@/components/display-frame";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The live demo display (`/d/demo`, muted in preview mode) in a wall-mounted TV: a sale lands
 * every few seconds, with its card and confetti.
 */
export function DemoTv({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[clamp(0.75rem,1.6vw,1.25rem)] bg-linear-to-b from-neutral-800 to-neutral-950 p-[clamp(0.375rem,0.8vw,0.75rem)] shadow-[0_50px_140px_-30px_rgb(0_0_0/0.95)] ring-1 ring-white/10",
        className,
      )}
    >
      <DisplayFrame
        src="/d/demo?preview=1"
        title={`Live demo of a ${siteConfig.name} screen`}
        className="rounded-[clamp(0.375rem,0.8vw,0.625rem)] bg-(--screen)"
      />
    </div>
  );
}

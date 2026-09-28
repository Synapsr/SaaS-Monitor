import { cn } from "@/lib/utils";

/** The pulse line of the SaaS Monitor logo. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="8 18 48 34" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <path
        d="M12 40h9l6-16 8 24 6-14h11"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { cn } from "@/lib/utils";

export function ImportProgress({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative h-1 overflow-hidden rounded-full bg-muted", className)}
    >
      <div className="absolute inset-y-0 left-0 w-1/3 animate-import-progress rounded-full bg-emerald-500 motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-40" />
    </div>
  );
}

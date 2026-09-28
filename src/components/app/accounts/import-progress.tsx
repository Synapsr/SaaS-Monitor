import { cn } from "@/lib/utils";
import styles from "./import-progress.module.css";

export function ImportProgress({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative h-1 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("absolute inset-y-0 left-0 w-1/3 rounded-full bg-emerald-500", styles.bar)}
      />
    </div>
  );
}

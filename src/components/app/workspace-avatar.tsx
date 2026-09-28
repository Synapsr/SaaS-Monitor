import { cn } from "@/lib/utils";

/** The first letter of a workspace's name on a tile, sized by `className`. */
export function WorkspaceAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center bg-foreground font-semibold text-background uppercase",
        className,
      )}
    >
      {Array.from(name.trim())[0] ?? "W"}
    </span>
  );
}

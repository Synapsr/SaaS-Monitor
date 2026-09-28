import { cn } from "@/lib/utils";

/** A numbered step of the connection guide. */
export function ConnectStep({
  number,
  title,
  className,
  children,
}: {
  number: number;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6",
        className,
      )}
    >
      <h2 className="flex items-center gap-3 font-medium">
        <span
          aria-hidden="true"
          className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background tabular-nums"
        >
          {number}
        </span>
        <span>
          <span className="sr-only">Step {number}: </span>
          {title}
        </span>
      </h2>
      <div className="flex flex-col gap-4 sm:pl-9">{children}</div>
    </section>
  );
}

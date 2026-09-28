import { cn } from "@/lib/utils";

/** A titled group of content on a page, e.g. "Screens" on the home page. */
export function PageSection({
  title,
  actions,
  children,
  className,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="min-w-0 text-base font-medium tracking-tight">
          {title}
        </h2>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

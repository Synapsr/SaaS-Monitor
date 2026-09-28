import { cn } from "@/lib/utils";

/** A titled group of settings in the screen editor. */
export function SettingsSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `settings-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className={cn("flex flex-col gap-5 border-t pt-8 first:border-t-0 first:pt-0", className)}
    >
      <h2 id={id} className="text-base font-medium tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A setting with its label and explanation on the left and a switch (or button) on the right. */
export function SettingRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1 pt-0.5">{children}</div>
    </div>
  );
}

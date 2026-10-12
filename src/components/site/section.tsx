import { cn } from "@/lib/utils";

/** The small capitals over a heading: what the section is about, in a word or two. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-eyebrow font-semibold text-(--glow) uppercase", className)}>
      {children}
    </p>
  );
}

/**
 * A section's heading: its eyebrow, title and introduction, on the left or centered. Headings
 * rise into view as they are scrolled to (`reveal`).
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "start",
  className,
}: {
  /** The title's id, which the section is labelled by. */
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "reveal flex max-w-2xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="text-title font-semibold text-balance">
        {title}
      </h2>
      {lead && <p className="text-lead text-pretty text-(--ink-2)">{lead}</p>}
    </div>
  );
}

/** The width every section lines up on. */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6", className)}>{children}</div>;
}

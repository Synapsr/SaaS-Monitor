import { ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A link to where a fact comes from: another site, never vouched for by ours. */
export function SourceLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      rel="nofollow noopener"
      className={cn(
        "inline-flex items-center gap-0.5 text-(--ink-3) underline decoration-white/20 underline-offset-2 transition-colors hover:text-(--ink) hover:decoration-current",
        className,
      )}
    >
      {children}
      <ArrowUpRightIcon aria-hidden className="size-3" />
    </a>
  );
}

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-3 -ml-1 inline-flex items-center gap-0.5 rounded-md pr-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ChevronLeftIcon className="size-4" />
      {children}
    </Link>
  );
}

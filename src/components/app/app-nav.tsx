"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app", label: "Home" },
  { href: "/app/screens", label: "Screens" },
  { href: "/app/accounts", label: "Stripe accounts" },
  { href: "/app/settings", label: "Settings" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="mx-auto w-full max-w-6xl px-2 sm:px-4">
      <ul className="-mb-px flex [scrollbar-width:none] overflow-x-auto">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center px-1 text-sm text-muted-foreground outline-none",
                  "after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity",
                  active && "text-foreground after:opacity-100",
                )}
              >
                <span className="rounded-md px-2 py-1.5 transition-colors group-hover:bg-muted group-hover:text-foreground group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

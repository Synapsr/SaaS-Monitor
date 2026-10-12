import { ArrowUpRightIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { DOCS_ICONS } from "@/components/docs/docs-icons";
import { DOCS_PAGES, type DocsPage } from "@/lib/site/docs/pages";
import { cn } from "@/lib/utils";

export interface DocsNavProps {
  current: DocsPage;
  /** Each page's address in the page's language. */
  hrefs: Record<DocsPage, string>;
  labels: Record<DocsPage, string>;
  /** "Docs", naming the navigation. */
  title: string;
  github: { label: string; href: string };
}

/** Every page of the docs, the current one lit: the sidebar of wide screens. */
export function DocsSidebar({ current, hrefs, labels, title, github }: DocsNavProps) {
  return (
    <nav aria-label={title} className="flex flex-col gap-6">
      <PageList current={current} hrefs={hrefs} labels={labels} />
      <a
        href={github.href}
        className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-(--ink-3) transition-colors duration-150 hover:text-(--ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--glow)"
      >
        <GitHubIcon className="size-4 shrink-0" />
        {github.label}
        <ArrowUpRightIcon
          aria-hidden
          className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    </nav>
  );
}

/**
 * The docs on phones and tablets: a bar under the header naming the page, which opens the list
 * of pages as a sheet (the Popover API, no script). A new page is a new sheet, closed.
 */
export function DocsMobileBar({ current, hrefs, labels, title, github }: DocsNavProps) {
  const Icon = DOCS_ICONS[current];
  return (
    <div className="sticky top-16 z-40 bg-(--screen)/80 shadow-[0_1px_0_var(--hairline)] backdrop-blur-xl backdrop-saturate-150 lg:hidden">
      <div className="mx-auto flex h-12 max-w-6xl items-center px-3 sm:px-4">
        <button
          type="button"
          popoverTarget="docs-menu"
          className="flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-full px-2.5 text-sm transition-[background-color,scale] duration-150 hover:bg-(--surface-raised) focus-visible:outline-2 focus-visible:outline-(--glow) active:scale-[0.96]"
        >
          <span className="text-(--ink-3)">{title}</span>
          <span aria-hidden className="text-(--ink-3)/60">
            /
          </span>
          <Icon aria-hidden className="size-4 shrink-0 text-(--glow)" />
          <span className="truncate font-medium text-(--ink)">{labels[current]}</span>
          <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-(--ink-3)" />
        </button>
      </div>
      <div
        key={current}
        id="docs-menu"
        popover="auto"
        className="docs-sheet rounded-3xl bg-(--popover) p-2 text-(--ink) shadow-(--shadow-popover)"
      >
        <nav aria-label={title}>
          <PageList current={current} hrefs={hrefs} labels={labels} large />
        </nav>
        <div className="mx-3 my-2 h-px bg-(--hairline)" />
        <a
          href={github.href}
          className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-(--ink-2) transition-colors duration-150 hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--glow)"
        >
          <GitHubIcon className="size-4.5 shrink-0" />
          {github.label}
          <ArrowUpRightIcon aria-hidden className="ml-auto size-4 text-(--ink-3)" />
        </a>
      </div>
    </div>
  );
}

function PageList({
  current,
  hrefs,
  labels,
  large = false,
}: Omit<DocsNavProps, "title" | "github"> & { large?: boolean }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {DOCS_PAGES.map((page) => {
        const Icon = DOCS_ICONS[page];
        const active = page === current;
        return (
          <li key={page}>
            <Link
              href={hrefs[page]}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 transition-[background-color,color] duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--glow)",
                large
                  ? "min-h-12 rounded-2xl px-4 text-[1.0625rem]"
                  : "min-h-10 rounded-xl px-3 text-sm",
                active
                  ? "bg-(--surface-raised) font-medium text-(--ink) shadow-(--edge)"
                  : "text-(--ink-2) hover:bg-(--surface) hover:text-(--ink)",
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "size-4 shrink-0 transition-colors duration-150",
                  active ? "text-(--glow)" : "text-(--ink-3) group-hover:text-(--ink-2)",
                )}
              />
              {labels[page]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

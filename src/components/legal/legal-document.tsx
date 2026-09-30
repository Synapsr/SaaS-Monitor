import Link from "next/link";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import { formatLegalDate, LEGAL_PAGES, type LegalPageId } from "@/lib/legal";
import { cn } from "@/lib/utils";
import "@/app/landing.css";

export interface LegalSection {
  /** The section's anchor, linked from the table of contents. */
  id: string;
  title: string;
  content: React.ReactNode;
  /** Set on a section written in another language than English, for screen readers. */
  lang?: string;
}

/**
 * A legal page of the site: its title, when it last changed, a table of contents and its
 * sections, on the landing page's stage so the site reads as one.
 */
export function LegalDocument({
  page,
  lead,
  updated,
  summary,
  sections,
}: {
  page: LegalPageId;
  lead: React.ReactNode;
  /** ISO date of the last change of substance. */
  updated: string;
  /** What to remember, before the details. */
  summary?: React.ReactNode;
  sections: LegalSection[];
}) {
  const title = LEGAL_PAGES.find(({ id }) => id === page)?.title;

  return (
    <div className="landing dark min-h-svh">
      <LandingHeader />
      <main className="mx-auto max-w-6xl px-5 pt-12 pb-24 sm:px-6 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
          <aside>
            <div className="flex flex-col gap-8 lg:sticky lg:top-24">
              <LegalPagesNav current={page} />
              <TableOfContents sections={sections} className="hidden lg:block" />
            </div>
          </aside>

          <article className="max-w-2xl min-w-0">
            <header>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 text-lg text-pretty text-(--ink-2)">{lead}</p>
              <p className="mt-4 text-sm text-(--ink-3)">
                Last updated <time dateTime={updated}>{formatLegalDate(updated)}</time>
              </p>
            </header>

            {/* Phones have no room for the side column: the contents come after the title. */}
            <TableOfContents
              sections={sections}
              className="mt-8 rounded-xl p-4 ring-1 ring-white/[0.08] lg:hidden"
            />

            {summary && <div className="mt-10">{summary}</div>}

            <div className="mt-12 flex flex-col gap-12">
              {sections.map(({ id, title, content, lang }) => (
                <section
                  key={id}
                  id={id}
                  lang={lang}
                  aria-labelledby={`${id}-title`}
                  className="scroll-mt-24"
                >
                  <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
                    {title}
                  </h2>
                  <div className="mt-4 flex flex-col gap-4 leading-7 text-(--ink-2)">{content}</div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

/** The three legal pages, one click from each other. */
function LegalPagesNav({ current }: { current: LegalPageId }) {
  return (
    <nav aria-label="Legal pages">
      <ul className="flex flex-wrap gap-1.5 text-sm lg:flex-col lg:gap-0.5">
        {LEGAL_PAGES.map(({ id, href, title }) => (
          <li key={id}>
            <Link
              href={href}
              aria-current={id === current ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-(--glow)",
                id === current
                  ? "bg-white/[0.06] font-medium text-(--ink)"
                  : "text-(--ink-2) hover:text-(--ink)",
              )}
            >
              {title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Long pages are read in bits: a policy is often opened for one question. */
function TableOfContents({
  sections,
  className,
}: {
  sections: LegalSection[];
  className?: string;
}) {
  return (
    <nav aria-label="On this page" className={className}>
      <p className="text-xs font-medium text-(--ink-3) lg:px-3">On this page</p>
      <ol className="mt-2 flex flex-col text-sm">
        {sections.map(({ id, title, lang }) => (
          <li key={id} lang={lang}>
            <a
              href={`#${id}`}
              className="block rounded-md py-1 text-(--ink-2) transition-colors hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--glow) lg:px-3"
            >
              {title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

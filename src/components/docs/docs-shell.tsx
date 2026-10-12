import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { DocsMobileBar, DocsSidebar, type DocsNavProps } from "@/components/docs/docs-nav";
import { buttonClass } from "@/components/site/button-styles";
import { JsonLd } from "@/components/site/json-ld";
import { RichText } from "@/components/site/rich-text";
import { SitePage } from "@/components/site/site-page";
import type { DocsText } from "@/lib/site/docs";
import {
  DOCS_PAGES,
  docsNeighbors,
  docsPath,
  githubDocPath,
  GITHUB_DOCS,
  type DocsPage,
} from "@/lib/site/docs/pages";
import type { SiteText } from "@/lib/site/i18n";
import type { SiteLanguage } from "@/lib/site/languages";
import { demoPath, localizedPath } from "@/lib/site/paths";
import { siteLinks } from "@/lib/site/rich-text";
import { cn } from "@/lib/utils";

export interface TocEntry {
  id: string;
  title: string;
}

export interface DocsShellProps {
  language: SiteLanguage;
  page: DocsPage;
  text: DocsText;
  site: SiteText;
  title: string;
  lead: string;
  /** Short facts under the lead, such as "About two minutes". */
  facts?: readonly string[];
  /** Buttons under the lead: the docs' home has its calls to action there. */
  actions?: React.ReactNode;
  /** The page's sections, for "On this page": left out of short pages. */
  toc?: readonly TocEntry[];
  /** The sections of the guides on GitHub that go deeper, by URL. */
  github?: readonly string[];
  /** The last word of the page, before the next one: the calls to action by default. */
  cta?: React.ReactNode;
  jsonLd: object;
  children: React.ReactNode;
}

/**
 * A page of the docs: the site's header and footer, the list of pages beside it (a menu under
 * the header on phones), the page itself, then where to go deeper, what to do and what to read
 * next. Wide screens keep "On this page" in a column of its own.
 */
export function DocsShell({
  language,
  page,
  text,
  site,
  title,
  lead,
  facts,
  actions,
  toc,
  github,
  cta,
  jsonLd,
  children,
}: DocsShellProps) {
  const hrefs = Object.fromEntries(
    DOCS_PAGES.map((other) => [other, localizedPath(language, docsPath(other))]),
  ) as Record<DocsPage, string>;
  const nav: DocsNavProps = {
    current: page,
    hrefs,
    labels: text.common.pages,
    title: text.common.docs,
    github: { label: text.common.githubDocs, href: GITHUB_DOCS.docs },
  };
  const { previous, next } = docsNeighbors(page);
  const hasToc = toc !== undefined && toc.length > 0;

  return (
    <SitePage language={language} path={docsPath(page)}>
      <JsonLd data={jsonLd} />
      <div className="docs relative isolate pb-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(40%_50%_at_30%_10%,var(--glow-wash),transparent_75%)]"
        />
        <DocsMobileBar {...nav} />
        <div
          className={cn(
            "mx-auto grid max-w-6xl px-5 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-x-12",
            hasToc && "xl:grid-cols-[12.5rem_minmax(0,1fr)_11rem] xl:gap-x-10",
          )}
        >
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <DocsSidebar {...nav} />
            </div>
          </aside>

          <article className="min-w-0">
            <header>
              <Breadcrumb
                label={text.common.breadcrumb}
                steps={[
                  { name: text.common.docs, href: hrefs.overview },
                  ...(page === "overview" ? [] : [{ name: text.common.pages[page], href: null }]),
                ]}
              />
              <h1 className="animate-rise max-w-3xl text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.04em] text-balance [animation-delay:60ms] lg:mt-4">
                {title}
              </h1>
              <p className="animate-rise text-lead mt-5 max-w-[42rem] text-pretty text-(--ink-2) [animation-delay:120ms]">
                <RichText text={lead} links={{}} />
              </p>
              {facts && facts.length > 0 && (
                <ul className="animate-rise mt-6 flex flex-wrap gap-2 [animation-delay:180ms]">
                  {facts.map((fact) => (
                    <li
                      key={fact}
                      className="flex items-center gap-1.5 rounded-full bg-(--surface-raised) py-1 pr-3 pl-2 text-sm text-(--ink-2) shadow-(--edge)"
                    >
                      <CheckIcon aria-hidden className="size-3.5 text-(--glow)" strokeWidth={2.5} />
                      {fact}
                    </li>
                  ))}
                </ul>
              )}
              {actions && (
                <div className="animate-rise mt-8 flex flex-col gap-3 [animation-delay:180ms] min-[440px]:flex-row min-[440px]:flex-wrap">
                  {actions}
                </div>
              )}
            </header>

            {hasToc && (
              <details className="group mt-8 rounded-2xl bg-(--surface) shadow-(--edge) xl:hidden">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 text-sm font-medium text-(--ink-2) outline-none focus-visible:outline-2 focus-visible:outline-(--glow) [&::-webkit-details-marker]:hidden">
                  {text.common.onThisPage}
                  <ArrowRightIcon
                    aria-hidden
                    className="size-4 text-(--ink-3) transition-transform duration-200 group-open:rotate-90"
                  />
                </summary>
                <nav aria-label={text.common.onThisPage}>
                  <TableOfContents entries={toc} className="px-2 pb-3" />
                </nav>
              </details>
            )}

            <div className="mt-12 sm:mt-14">{children}</div>

            {github && github.length > 0 && (
              <GitHubLinks
                title={text.common.github.title}
                text={text.common.github.text}
                english={language === "en" ? null : site.footer.inEnglish}
                urls={github}
              />
            )}

            {cta ?? (
              <DocsCta language={language} text={text.common.cta} points={site.hero.points} />
            )}

            <p className="mt-6 text-sm text-(--ink-3)">
              <RichText text={site.footer.help} links={siteLinks(language)} />
            </p>

            <PageLinks
              label={text.common.docs}
              previous={
                previous && {
                  label: text.common.previous,
                  name: text.common.pages[previous],
                  href: hrefs[previous],
                }
              }
              next={
                next && {
                  label: text.common.next,
                  name: text.common.pages[next],
                  href: hrefs[next],
                }
              }
            />
          </article>

          {hasToc && (
            <aside className="hidden xl:block">
              <nav aria-label={text.common.onThisPage} className="sticky top-24">
                <p className="px-3 text-xs font-medium text-(--ink-3)">{text.common.onThisPage}</p>
                <TableOfContents entries={toc} className="mt-2" />
              </nav>
            </aside>
          )}
        </div>
      </div>
    </SitePage>
  );
}

function Breadcrumb({
  label,
  steps,
}: {
  label: string;
  steps: { name: string; href: string | null }[];
}) {
  return (
    // Phones name the page in the docs' bar, just above.
    <nav aria-label={label} className="animate-rise hidden lg:block">
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-(--ink-3)">
        {steps.map(({ name, href }, index) => (
          <li key={name} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden>/</span>}
            {href && index < steps.length - 1 ? (
              <Link
                href={href}
                className="rounded-sm transition-colors duration-150 hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)"
              >
                {name}
              </Link>
            ) : (
              <span aria-current="page" className="text-(--glow)">
                {name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function TableOfContents({
  entries,
  className,
}: {
  entries: readonly TocEntry[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col text-sm", className)}>
      {entries.map(({ id, title }) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className="block rounded-lg px-3 py-1.5 text-pretty text-(--ink-2) transition-colors duration-150 hover:text-(--ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--glow)"
          >
            {title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** The sections of the guides on GitHub that go deeper, each by its file and anchor. */
function GitHubLinks({
  title,
  text,
  english,
  urls,
}: {
  title: string;
  text: string;
  /** "in English", on pages in another language: the guides are written in English. */
  english: string | null;
  urls: readonly string[];
}) {
  return (
    <aside className="mt-16 rounded-2xl bg-(--surface) p-5 shadow-(--edge) sm:p-6">
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--surface-raised) text-(--ink) shadow-(--edge)"
        >
          <GitHubIcon className="size-4.5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="flex flex-wrap items-center gap-x-2 font-medium">
            {title}
            {english && (
              <span className="rounded-sm px-1 py-px text-[0.625rem] font-normal text-(--ink-3) uppercase shadow-(--edge)">
                <span className="sr-only">{english}</span>
                <span aria-hidden>en</span>
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-pretty text-(--ink-3)">{text}</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-col">
        {urls.map((url) => {
          const { file, anchor } = githubDocPath(url);
          return (
            <li key={url} className="shadow-[0_-1px_0_var(--hairline)]">
              <a
                href={url}
                hrefLang="en"
                className="group flex min-h-11 items-center justify-between gap-4 rounded-lg py-2.5 font-mono text-[0.8125rem] focus-visible:outline-2 focus-visible:outline-(--glow)"
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="text-(--ink) transition-colors duration-150 group-hover:text-(--glow)">
                    {file}
                  </span>
                  {anchor && <span className="text-(--ink-3)">{anchor}</span>}
                </span>
                <ArrowUpRightIcon
                  aria-hidden
                  className="size-4 shrink-0 text-(--ink-3) transition-[color,translate] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--ink)"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/** The calls to action every page ends on: sign up, or see the demo first. */
export function DocsCta({
  language,
  text,
  points,
}: {
  language: SiteLanguage;
  text: DocsText["common"]["cta"];
  points: readonly string[];
}) {
  return (
    <CtaBand title={text.title} text={text.text}>
      <div className="flex flex-col gap-3 min-[440px]:flex-row min-[440px]:flex-wrap">
        <Link href="/sign-up" prefetch={false} className={buttonClass({ size: "lg" })}>
          {text.primary}
          <ArrowRightIcon aria-hidden />
        </Link>
        <Link
          href={demoPath(language)}
          prefetch={false}
          className={buttonClass({ variant: "secondary", size: "lg" })}
        >
          {text.secondary}
        </Link>
      </div>
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-(--ink-3)">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-1.5">
            <CheckIcon aria-hidden className="size-3.5 text-(--glow)" strokeWidth={2.5} />
            {point}
          </li>
        ))}
      </ul>
    </CtaBand>
  );
}

/** A band lit from its corner, with a heading, a line and what to do. */
export function CtaBand({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative isolate mt-6 overflow-hidden rounded-[1.75rem] bg-(--surface) p-6 shadow-(--edge) sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 -z-10 size-[28rem] bg-[radial-gradient(closest-side,var(--glow-wash),transparent)]"
      />
      <h2 className="max-w-xl text-[clamp(1.625rem,1.3rem+1.2vw,2.25rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance">
        {title}
      </h2>
      <p className="mt-3 max-w-xl leading-relaxed text-pretty text-(--ink-2)">{text}</p>
      <div className="mt-7">{children}</div>
    </section>
  );
}

interface PageLink {
  label: string;
  name: string;
  href: string;
}

function PageLinks({
  label,
  previous,
  next,
}: {
  label: string;
  previous: PageLink | null;
  next: PageLink | null;
}) {
  const linkClass =
    "group flex flex-col gap-1 rounded-2xl p-4 shadow-(--edge) transition-[background-color,box-shadow] duration-150 hover:bg-(--surface) hover:shadow-(--edge-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)";
  return (
    <nav aria-label={label} className="mt-6 grid gap-3 sm:grid-cols-2">
      {previous ? (
        <Link href={previous.href} rel="prev" className={linkClass}>
          <span className="flex items-center gap-1.5 text-xs text-(--ink-3)">
            <ArrowLeftIcon
              aria-hidden
              className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
            />
            {previous.label}
          </span>
          <span className="font-medium text-(--ink)">{previous.name}</span>
        </Link>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
      {next && (
        <Link href={next.href} rel="next" className={cn(linkClass, "items-end text-right")}>
          <span className="flex items-center gap-1.5 text-xs text-(--ink-3)">
            {next.label}
            <ArrowRightIcon
              aria-hidden
              className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </span>
          <span className="font-medium text-(--ink)">{next.name}</span>
        </Link>
      )}
    </nav>
  );
}

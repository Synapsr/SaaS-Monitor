import { ArrowRightIcon, ArrowUpRightIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { PageCards } from "@/components/docs/docs-blocks";
import { DOCS_ICONS } from "@/components/docs/docs-icons";
import { DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { buttonClass } from "@/components/site/button-styles";
import {
  DOCS_SLUGS,
  DOCS_TEXT_KEYS,
  docsPath,
  githubDocPath,
  GITHUB_DOCS,
  type DocsSlug,
} from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";
import { demoPath, localizedPath } from "@/lib/site/paths";

/** The docs' home: what they promise, where to start, every guide, and the technical guides. */
export function OverviewDoc({ language, text, site }: DocsPageProps) {
  const page = text.overview;
  const href = (slug: DocsSlug) => localizedPath(language, docsPath(slug));
  const summary = (slug: DocsSlug) => text[DOCS_TEXT_KEYS[slug]].summary;
  const StartIcon = DOCS_ICONS["get-started"];
  const technical = [
    { name: page.github.links.stripe, url: GITHUB_DOCS.stripe },
    { name: page.github.links.wall, url: GITHUB_DOCS.wall },
    { name: page.github.links.selfHosting, url: GITHUB_DOCS.selfHosting },
  ];

  return (
    <DocsShell
      language={language}
      page="overview"
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      actions={
        <>
          <Link href="/sign-up" prefetch={false} className={buttonClass({ size: "lg" })}>
            {text.common.cta.primary}
            <ArrowRightIcon aria-hidden />
          </Link>
          <Link
            href={demoPath(language)}
            prefetch={false}
            className={buttonClass({ variant: "secondary", size: "lg" })}
          >
            <PlayIcon aria-hidden className="fill-current" />
            {text.common.cta.secondary}
          </Link>
        </>
      }
      jsonLd={docsJsonLd({
        language,
        page: "overview",
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages.overview },
      })}
    >
      <Link
        href={href("get-started")}
        className="group relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl bg-(--surface-raised) p-6 shadow-(--edge-glow) transition-[background-color] duration-150 hover:bg-(--surface-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow) sm:p-8 md:flex-row md:items-center md:justify-between"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-[radial-gradient(60%_100%_at_20%_0%,var(--glow-wash),transparent)]"
        />
        <div className="flex max-w-md flex-col gap-3">
          <span className="text-eyebrow font-semibold text-(--glow) uppercase">{page.start}</span>
          <span className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.03em]">
            <StartIcon aria-hidden className="size-6 text-(--glow)" />
            {text.common.pages["get-started"]}
          </span>
          <span className="leading-relaxed text-pretty text-(--ink-2)">
            {summary("get-started")}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-(--ink)">
            {page.read}
            <ArrowRightIcon
              aria-hidden
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </span>
        </div>
        <ol className="flex flex-col gap-3 md:w-64 md:shrink-0">
          {site.steps.items.map((step, index) => (
            <li key={step.title} className="flex items-center gap-3 text-sm text-(--ink-2)">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--screen) text-xs font-semibold text-(--glow) tabular-nums shadow-[0_0_0_1px_color-mix(in_oklab,var(--glow)_45%,transparent)]"
              >
                {index + 1}
              </span>
              {step.title}
            </li>
          ))}
        </ol>
      </Link>

      <PageCards
        className="mt-3"
        cards={DOCS_SLUGS.filter((slug) => slug !== "get-started").map((slug) => ({
          href: href(slug),
          icon: DOCS_ICONS[slug],
          title: text.common.pages[slug],
          text: summary(slug),
        }))}
      />

      <section aria-labelledby="technical-title" className="mt-16">
        <h2
          id="technical-title"
          className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em]"
        >
          <GitHubIcon className="size-5" />
          {page.github.title}
        </h2>
        <p className="mt-2 max-w-[42rem] text-pretty text-(--ink-2)">{page.github.text}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {technical.map(({ name, url }) => (
            <li key={url} className="flex">
              <a
                href={url}
                hrefLang="en"
                className="group flex w-full flex-col gap-1 rounded-2xl p-4 shadow-(--edge) transition-[background-color,box-shadow] duration-150 hover:bg-(--surface) hover:shadow-(--edge-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)"
              >
                <span className="flex items-center justify-between gap-2 font-medium text-(--ink)">
                  {name}
                  <ArrowUpRightIcon
                    aria-hidden
                    className="size-4 shrink-0 text-(--ink-3) transition-[color,translate] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--ink)"
                  />
                </span>
                <span className="font-mono text-xs text-(--ink-3)">{githubDocPath(url).file}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </DocsShell>
  );
}

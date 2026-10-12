import { ArrowUpRightIcon, KeyRoundIcon, Trash2Icon } from "lucide-react";
import { GitHubIcon } from "@/components/brand-icons";
import { Callout, Checklist, DocsSection, Paragraph } from "@/components/docs/docs-blocks";
import { DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { buttonClass } from "@/components/site/button-styles";
import { siteConfig } from "@/lib/site";
import { GITHUB_DOCS } from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";

const PAGE = "security";

/** Why connecting Stripe is safe: the key, its encryption, what is stored and shown, and who sees it. */
export function SecurityDoc({ language, text, site, links }: DocsPageProps) {
  const page = text.security;

  return (
    <DocsShell
      language={language}
      page={PAGE}
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      toc={[
        { id: "read-only-key", title: page.key.title },
        { id: "encryption", title: page.encryption.title },
        { id: "data", title: page.data.title },
        { id: "screens", title: page.screens.title },
        { id: "tracking", title: page.tracking.title },
        { id: "others", title: page.others.title },
        { id: "open-source", title: page.openSource.title },
      ]}
      github={[GITHUB_DOCS.stripeSecurity, GITHUB_DOCS.stripeKey, GITHUB_DOCS.security]}
      jsonLd={docsJsonLd({
        language,
        page: PAGE,
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages[PAGE] },
      })}
    >
      <dl className="grid gap-3 sm:grid-cols-3">
        {page.facts.map((fact) => (
          <div
            key={fact.value}
            className="flex flex-col-reverse justify-end gap-1 rounded-2xl bg-(--surface) p-5 shadow-(--edge)"
          >
            <dt className="text-sm text-pretty text-(--ink-3)">{fact.label}</dt>
            <dd className="text-2xl font-semibold tracking-[-0.03em] text-(--ink)">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <DocsSection id="read-only-key" title={page.key.title}>
        <Paragraph text={page.key.text} links={links} />
      </DocsSection>

      <DocsSection id="encryption" title={page.encryption.title}>
        <Callout
          icon={KeyRoundIcon}
          title="AES-256-GCM"
          text={page.encryption.text}
          links={links}
        />
      </DocsSection>

      <DocsSection id="data" title={page.data.title}>
        <Paragraph text={page.data.text} links={links} />
        <div className="flex max-w-[42rem] items-start gap-3 text-[1.0625rem] leading-[1.6] text-(--ink-2)">
          <Trash2Icon aria-hidden className="mt-1 size-4.5 shrink-0 text-(--glow)" />
          <span className="text-pretty">{page.data.delete}</span>
        </div>
      </DocsSection>

      <DocsSection id="screens" title={page.screens.title}>
        <Checklist items={page.screens.items} links={links} />
      </DocsSection>

      <DocsSection id="tracking" title={page.tracking.title}>
        <Paragraph text={page.tracking.text} links={links} />
      </DocsSection>

      <DocsSection id="others" title={page.others.title}>
        <Paragraph text={page.others.text} links={links} />
      </DocsSection>

      <DocsSection id="open-source" title={page.openSource.title}>
        <Paragraph text={page.openSource.text} links={links} />
        <div className="flex flex-col gap-3 min-[440px]:flex-row min-[440px]:flex-wrap">
          <a href={siteConfig.repositoryUrl} className={buttonClass({ variant: "secondary" })}>
            <GitHubIcon />
            {site.nav.github}
          </a>
          <a href={GITHUB_DOCS.security} className={buttonClass({ variant: "ghost" })}>
            {page.openSource.report}
            <ArrowUpRightIcon aria-hidden />
          </a>
        </div>
      </DocsSection>
    </DocsShell>
  );
}

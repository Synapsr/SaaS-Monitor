import { ArrowUpRightIcon, StarIcon, TriangleAlertIcon } from "lucide-react";
import { GitHubIcon } from "@/components/brand-icons";
import { Callout, DocsSection, Paragraph } from "@/components/docs/docs-blocks";
import { CtaBand, DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { buttonClass } from "@/components/site/button-styles";
import { INSTALL_COMMANDS, Terminal, UPDATE_COMMANDS } from "@/components/site/terminal";
import { siteConfig } from "@/lib/site";
import { GITHUB_DOCS } from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";

const PAGE = "self-hosting";

/** Running SaaS Monitor on one's own server: install, address, HTTPS, updates and data. */
export function SelfHostingDoc({ language, text, site, links }: DocsPageProps) {
  const page = text.selfHosting;
  const terminal = {
    title: site.openSource.terminal,
    copy: site.openSource.copy,
    copied: site.openSource.copied,
    failed: site.openSource.copyFailed,
  };

  return (
    <DocsShell
      language={language}
      page={PAGE}
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      toc={[
        { id: "install", title: page.install.title },
        { id: "app-url", title: page.tv.title },
        { id: "https", title: page.https.title },
        { id: "updates", title: page.updates.title },
        { id: "data", title: page.data.title },
      ]}
      github={[
        GITHUB_DOCS.selfHostingInstall,
        GITHUB_DOCS.selfHostingConfiguration,
        GITHUB_DOCS.selfHostingHttps,
        GITHUB_DOCS.selfHostingBackups,
      ]}
      cta={
        <CtaBand title={page.cta.title} text={page.cta.text}>
          <Terminal commands={INSTALL_COMMANDS} labels={terminal} />
          <div className="mt-6 flex flex-col gap-3 min-[440px]:flex-row min-[440px]:flex-wrap">
            <a href={GITHUB_DOCS.selfHosting} className={buttonClass({ size: "lg" })}>
              <GitHubIcon />
              {page.cta.guide}
              <ArrowUpRightIcon aria-hidden />
            </a>
            <a
              href={siteConfig.repositoryUrl}
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              <StarIcon aria-hidden />
              {site.closing.secondary}
            </a>
          </div>
        </CtaBand>
      }
      jsonLd={docsJsonLd({
        language,
        page: PAGE,
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages[PAGE] },
      })}
    >
      <dl className="grid grid-cols-3 gap-3">
        {site.openSource.facts.map((fact) => (
          <div
            key={fact.label}
            className="flex flex-col-reverse justify-end gap-1 rounded-2xl bg-(--surface) p-4 shadow-(--edge) sm:p-5"
          >
            <dt className="text-xs text-pretty text-(--ink-3) sm:text-sm">{fact.label}</dt>
            <dd className="text-xl font-semibold tracking-[-0.03em] text-(--ink) sm:text-2xl">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      <DocsSection id="install" title={page.install.title}>
        <Paragraph text={page.install.requirements} links={links} />
        <Terminal commands={INSTALL_COMMANDS} labels={terminal} />
        <Paragraph text={page.install.script} links={links} />
        <Paragraph text={page.install.then} links={links} />
      </DocsSection>

      <DocsSection id="app-url" title={page.tv.title}>
        <Paragraph text={page.tv.text} links={links} />
        <Callout
          icon={TriangleAlertIcon}
          title={page.tv.callout.title}
          text={page.tv.callout.text}
          links={links}
          tone="quiet"
        />
      </DocsSection>

      <DocsSection id="https" title={page.https.title}>
        <Paragraph text={page.https.text} links={links} />
        <Paragraph text={page.https.without} links={links} />
      </DocsSection>

      <DocsSection id="updates" title={page.updates.title}>
        <Terminal commands={UPDATE_COMMANDS} labels={terminal} />
        <Paragraph text={page.updates.text} links={links} />
      </DocsSection>

      <DocsSection id="data" title={page.data.title}>
        <Paragraph text={page.data.text} links={links} />
        <Paragraph text={page.data.signups} links={links} />
      </DocsSection>
    </DocsShell>
  );
}

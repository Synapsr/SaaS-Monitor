import { ArrowDownRightIcon, ArrowUpRightIcon, ScaleIcon, ZapIcon } from "lucide-react";
import { Checklist, DocsSection, Paragraph } from "@/components/docs/docs-blocks";
import { DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { RichText } from "@/components/site/rich-text";
import { GITHUB_DOCS } from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";
import { formatDollars } from "@/lib/site/format";
import { INTL_LOCALES } from "@/lib/site/languages";
import { cn } from "@/lib/utils";

const PAGE = "numbers";

/** The demo's MRR, as the home page shows it. */
const DEMO_MRR = 14_880;

/** The changes of MRR, and whether each one adds to it. */
const MOVEMENTS = [
  { kind: "new", up: true },
  { kind: "expansion", up: true },
  { kind: "reactivation", up: true },
  { kind: "contraction", up: false },
  { kind: "churn", up: false },
] as const;

/** How the numbers are computed, for founders who check them against Stripe. */
export function NumbersDoc({ language, text, site, links }: DocsPageProps) {
  const page = text.numbers;
  const locale = INTL_LOCALES[language];

  return (
    <DocsShell
      language={language}
      page={PAGE}
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      toc={[
        { id: "mrr", title: page.mrr.title },
        { id: "movements", title: page.movements.title },
        { id: "arr", title: page.arr.title },
        { id: "revenue", title: page.revenue.title },
        { id: "currencies", title: page.currencies.title },
        { id: "updates", title: page.updates.title },
        { id: "history", title: page.history.title },
        { id: "limits", title: page.limits.title },
      ]}
      github={[
        GITHUB_DOCS.stripeMrr,
        GITHUB_DOCS.stripeUpdates,
        GITHUB_DOCS.stripeImport,
        GITHUB_DOCS.stripeConnect,
      ]}
      jsonLd={docsJsonLd({
        language,
        page: PAGE,
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages[PAGE] },
      })}
    >
      <DocsSection id="mrr" title={page.mrr.title}>
        <Checklist items={page.mrr.items} links={links} />
      </DocsSection>

      <DocsSection id="movements" title={page.movements.title}>
        <Paragraph text={page.movements.text} links={links} />
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MOVEMENTS.map(({ kind, up }) => {
            const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
            const movement = page.movements.kinds[kind];
            return (
              <li
                key={kind}
                className="flex flex-col gap-1.5 rounded-xl bg-(--surface) px-3.5 py-3 shadow-(--edge)"
              >
                <Icon
                  aria-hidden
                  className={cn("size-4", up ? "text-(--glow)" : "text-(--ink-3)")}
                />
                <span className="font-medium text-(--ink)">{movement.name}</span>
                <span className="text-sm text-(--ink-3)">{movement.text}</span>
              </li>
            );
          })}
        </ul>
      </DocsSection>

      <DocsSection id="arr" title={page.arr.title}>
        <p
          aria-hidden
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums sm:text-3xl"
        >
          <span>
            {formatDollars(DEMO_MRR, locale)} <span className="text-base text-(--ink-3)">MRR</span>
          </span>
          <span className="text-(--ink-3)">× 12 =</span>
          <span className="text-(--glow)">
            {formatDollars(DEMO_MRR * 12, locale)}{" "}
            <span className="text-base text-(--ink-3)">ARR</span>
          </span>
        </p>
        <Paragraph text={page.arr.text} links={links} />
      </DocsSection>

      <DocsSection id="revenue" title={page.revenue.title}>
        <Paragraph text={page.revenue.text} links={links} />
        <Paragraph text={page.revenue.connect} links={links} />
      </DocsSection>

      <DocsSection id="currencies" title={page.currencies.title}>
        <Paragraph text={page.currencies.text} links={links} />
      </DocsSection>

      <DocsSection id="updates" title={page.updates.title}>
        <Paragraph text={page.updates.text} links={links} />
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-2xl bg-(--glow)/[0.05] p-5 shadow-(--edge-glow)">
            <dt className="flex items-center gap-2 text-sm text-(--glow)">
              <ZapIcon aria-hidden className="size-4" />
              {page.updates.webhook.label}
            </dt>
            <dd className="text-xl font-semibold tracking-[-0.02em] text-balance">
              {page.updates.webhook.value}
            </dd>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-(--surface) p-5 shadow-(--edge)">
            <dt className="text-sm text-(--ink-3)">{page.updates.polling.label}</dt>
            <dd className="text-pretty text-(--ink-2)">{page.updates.polling.value}</dd>
          </div>
        </dl>
        <Paragraph text={page.updates.daily} links={links} />
      </DocsSection>

      <DocsSection id="history" title={page.history.title}>
        <Paragraph text={page.history.text} links={links} />
      </DocsSection>

      <DocsSection id="limits" title={page.limits.title}>
        <div className="flex max-w-[42rem] gap-4 rounded-2xl bg-(--surface) p-5 shadow-(--edge)">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--surface-raised) text-(--ink-2) shadow-(--edge)"
          >
            <ScaleIcon className="size-4.5" />
          </span>
          <div className="min-w-0 pt-1.5">
            <p className="text-pretty text-(--ink-2)">
              <RichText text={page.limits.text} links={links} />
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-pretty text-(--ink-2) marker:text-(--ink-3)">
              {page.limits.items.map((item) => (
                <li key={item}>
                  <RichText text={item} links={links} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DocsSection>
    </DocsShell>
  );
}

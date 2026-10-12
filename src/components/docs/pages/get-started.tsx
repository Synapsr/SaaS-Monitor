import { ShieldCheckIcon } from "lucide-react";
import { Callout, DocsSection, PageCards, Paragraph, Steps } from "@/components/docs/docs-blocks";
import { DOCS_ICONS } from "@/components/docs/docs-icons";
import { DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { cn } from "@/lib/utils";
import { DOCS_TEXT_KEYS, docsPath, GITHUB_DOCS, type DocsSlug } from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";
import { localizedPath } from "@/lib/site/paths";
import { STRIPE_KEY_PERMISSIONS, type StripePermissionId } from "@/lib/stripe-permissions";
import { howTo } from "@/lib/structured-data";

const PAGE = "get-started";

/** Which words of the page say why each permission is needed. */
const PERMISSION_WHY = {
  rak_subscription_read: "subscriptions",
  rak_customer_read: "customers",
  rak_charge_read: "charges",
  rak_event_read: "events",
  rak_product_read: "products",
  rak_plan_read: "prices",
  rak_coupon_read: "coupons",
  rak_webhook_write: "webhooks",
} as const satisfies Record<StripePermissionId, string>;

/** From sign-up to a screen on the TV: four steps, the key's permissions, and what's next. */
export function GetStartedDoc({ language, text, site, links }: DocsPageProps) {
  const page = text.getStarted;
  const { steps, permissions } = page;
  const items = [steps.account, steps.connect, steps.import, steps.tv];
  const nextPages: DocsSlug[] = ["wall-display", "customize", "apps"];

  const toc = [
    { id: "steps", title: steps.title },
    { id: "permissions", title: permissions.title },
    { id: "test-data", title: page.test.title },
    { id: "next", title: page.next.title },
  ];

  return (
    <DocsShell
      language={language}
      page={PAGE}
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      facts={page.facts}
      toc={toc}
      github={[GITHUB_DOCS.stripeKey, GITHUB_DOCS.stripeImport, GITHUB_DOCS.wall]}
      jsonLd={docsJsonLd({
        language,
        page: PAGE,
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages[PAGE] },
        image: `/images/demo/${language}.webp`,
        extra: [
          howTo({
            language,
            path: docsPath(PAGE),
            name: page.title,
            description: page.lead,
            totalTime: "PT2M",
            steps: items.map((step, index) => ({
              name: step.title,
              text: step.text,
              anchor: `step-${index + 1}`,
            })),
          }),
        ],
      })}
    >
      <DocsSection id="steps" title={steps.title}>
        <Steps steps={items} links={links} />
      </DocsSection>

      <DocsSection id="permissions" title={permissions.title}>
        <Paragraph text={permissions.lead} links={links} />
        <div className="overflow-hidden rounded-2xl shadow-(--edge)">
          <table className="w-full text-left text-sm">
            <thead className="hidden bg-(--surface) sm:table-header-group">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-(--ink-3)">
                  {permissions.columns.permission}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-(--ink-3)">
                  {permissions.columns.access}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-(--ink-3)">
                  {permissions.columns.why}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--hairline)">
              {STRIPE_KEY_PERMISSIONS.map((permission) => {
                const write = permission.access === "Write";
                return (
                  <tr
                    key={permission.id}
                    className={cn(
                      "flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 sm:table-row sm:p-0",
                      write && "bg-(--glow)/[0.04]",
                    )}
                  >
                    <th
                      scope="row"
                      className="font-medium text-(--ink) sm:px-4 sm:py-3 sm:align-top"
                    >
                      {permission.label}
                    </th>
                    <td className="sm:px-4 sm:py-3 sm:align-top">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            write
                              ? "bg-(--glow)/10 text-(--glow) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_25%,transparent)]"
                              : "bg-(--surface-raised) text-(--ink-2) shadow-(--edge)",
                          )}
                        >
                          {write ? permissions.access.write : permissions.access.read}
                        </span>
                        {"optional" in permission && permission.optional && (
                          <span className="text-xs text-(--ink-3)">{permissions.optional}</span>
                        )}
                      </span>
                    </td>
                    <td className="w-full text-pretty text-(--ink-2) sm:w-auto sm:px-4 sm:py-3 sm:align-top">
                      {permissions.why[PERMISSION_WHY[permission.id]]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Callout
          icon={ShieldCheckIcon}
          title={permissions.callout.title}
          text={permissions.callout.text}
          links={links}
        />
        <Paragraph text={permissions.webhook} links={links} />
      </DocsSection>

      <DocsSection id="test-data" title={page.test.title}>
        <Paragraph text={page.test.text} links={links} />
      </DocsSection>

      <DocsSection id="next" title={page.next.title}>
        <Paragraph text={page.next.text} links={links} />
        <PageCards
          columns={1}
          cards={nextPages.map((slug) => ({
            href: localizedPath(language, docsPath(slug)),
            icon: DOCS_ICONS[slug],
            title: text.common.pages[slug],
            text: text[DOCS_TEXT_KEYS[slug]].summary,
          }))}
        />
      </DocsSection>
    </DocsShell>
  );
}

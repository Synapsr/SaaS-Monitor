import Image from "next/image";
import { DocsSection, Paragraph } from "@/components/docs/docs-blocks";
import { DocsShell } from "@/components/docs/docs-shell";
import type { DocsPageProps } from "@/components/docs/page-props";
import { LogoMark } from "@/components/logo";
import { RichText } from "@/components/site/rich-text";
import { StoreBadges } from "@/components/site/store-badges";
import { formatAmount, formatPayment, countryFlag, countryName } from "@/lib/display/format";
import { displayLocale } from "@/lib/display/i18n";
import { apps } from "@/lib/site";
import { GITHUB_DOCS } from "@/lib/site/docs/pages";
import { docsJsonLd } from "@/lib/site/docs/structured-data";
import type { SiteLanguage } from "@/lib/site/languages";

const PAGE = "apps";

/** The store pictures, cropped to their device (`public/images/apps`). */
const IMAGES = {
  iphone: { src: "/images/apps/iphone-live.webp", width: 660, height: 1284 },
  watch: { src: "/images/apps/watch-mrr.webp", width: 422, height: 514 },
  wear: { src: "/images/apps/wear-mrr.webp", width: 454, height: 454 },
  share: { src: "/images/apps/share-payment.webp", width: 520, height: 445 },
};

/** The SaaS Monitor app: adding a screen, notifications, widgets and watches, sharing, privacy. */
export function AppsDoc({ language, text, site, links }: DocsPageProps) {
  const page = text.apps;
  const pending = !apps.appStore.live && !apps.googlePlay.live;

  return (
    <DocsShell
      language={language}
      page={PAGE}
      text={text}
      site={site}
      title={page.title}
      lead={page.lead}
      toc={[
        { id: "add-a-screen", title: page.add.title },
        { id: "notifications", title: page.notifications.title },
        { id: "widgets", title: page.widgets.title },
        { id: "tv-mode", title: page.tv.title },
        { id: "share", title: page.share.title },
        { id: "privacy", title: page.privacy.title },
      ]}
      github={[GITHUB_DOCS.wallPhone, GITHUB_DOCS.wallEvents]}
      jsonLd={docsJsonLd({
        language,
        page: PAGE,
        title: page.title,
        description: page.meta.description,
        names: { docs: text.common.docs, page: text.common.pages[PAGE] },
        image: IMAGES.iphone.src,
      })}
    >
      <div className="relative isolate grid gap-8 overflow-hidden rounded-3xl bg-(--surface) p-6 shadow-(--edge) sm:grid-cols-[minmax(0,1fr)_12rem] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_70%_at_85%_30%,var(--glow-wash),transparent_75%)]"
        />
        <div className="flex flex-col justify-center gap-5">
          <p className="text-sm text-(--ink-3)">{site.apps.platforms}</p>
          <StoreBadges text={site.apps.stores} />
          {pending && (
            <p className="max-w-md text-sm text-pretty text-(--ink-3)">{site.apps.pending}</p>
          )}
        </div>
        <div className="relative -mb-8 hidden h-60 sm:block">
          <Image
            {...IMAGES.iphone}
            alt={site.apps.images.iphone}
            sizes="176px"
            className="absolute inset-x-0 top-0 mx-auto w-44 [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] drop-shadow-[0_30px_40px_rgb(0_0_0/0.8)]"
          />
        </div>
      </div>

      <DocsSection id="add-a-screen" title={page.add.title}>
        <ol className="flex max-w-[42rem] flex-col gap-4">
          {page.add.steps.map((step, index) => (
            <li key={step} className="flex gap-3.5 text-[1.0625rem] leading-[1.6] text-(--ink-2)">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--glow)/10 text-sm font-medium text-(--glow) tabular-nums"
              >
                {index + 1}
              </span>
              <span className="pt-0.5 text-pretty">
                <RichText text={step} links={links} />
              </span>
            </li>
          ))}
        </ol>
      </DocsSection>

      <DocsSection id="notifications" title={page.notifications.title}>
        <NotificationPreview language={language} now={page.notifications.now} />
        <Paragraph text={page.notifications.text} links={links} />
        <Paragraph text={page.notifications.choose} links={links} />
        <Paragraph text={page.notifications.sound} links={links} />
        <Paragraph text={page.notifications.speed} links={links} />
      </DocsSection>

      <DocsSection id="widgets" title={page.widgets.title}>
        <Paragraph text={page.widgets.text} links={links} />
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-40 rounded-[2.125rem] bg-linear-to-b from-(--bezel-top) to-(--bezel-bottom) p-2 shadow-(--shadow-device)">
            <Image
              {...IMAGES.watch}
              alt={site.apps.images.watch}
              sizes="144px"
              className="w-full rounded-[1.625rem] outline-1 -outline-offset-1 outline-(--image-outline)"
            />
          </div>
          <div className="w-44 rounded-full bg-linear-to-b from-(--bezel-top) to-(--bezel-bottom) p-2 shadow-(--shadow-device)">
            <Image
              {...IMAGES.wear}
              alt={page.widgets.wearAlt}
              sizes="160px"
              className="w-full rounded-full outline-1 -outline-offset-1 outline-(--image-outline)"
            />
          </div>
        </div>
      </DocsSection>

      <DocsSection id="tv-mode" title={page.tv.title}>
        <Paragraph text={page.tv.text} links={links} />
      </DocsSection>

      <DocsSection id="share" title={page.share.title}>
        <Paragraph text={page.share.text} links={links} />
        <Image
          {...IMAGES.share}
          alt={page.share.imageAlt}
          sizes="320px"
          className="w-80 max-w-full rounded-2xl shadow-(--shadow-device) outline-1 -outline-offset-1 outline-(--image-outline)"
        />
      </DocsSection>

      <DocsSection id="privacy" title={page.privacy.title}>
        <Paragraph text={page.privacy.text} links={links} />
      </DocsSection>
    </DocsShell>
  );
}

/**
 * Two notifications as a phone shows them, worded as the server words them
 * (`src/server/push/content.ts`): a new subscriber, then the payment that started it, in the
 * page's language.
 */
function NotificationPreview({ language, now }: { language: SiteLanguage; now: string }) {
  const { locale, text } = displayLocale(language);
  const where = ["Pro", [countryFlag("US"), countryName("US", language)].join(" ")];
  const notifications = [
    {
      title: text.moments.titles.new,
      body: [`${formatAmount(4900, "usd", locale, { signed: true })} MRR`, ...where].join(" · "),
    },
    {
      title: text.moments.titles.payment,
      body: [formatPayment(4900, "usd", locale), ...where].join(" · "),
    },
  ];
  return (
    <div
      aria-hidden
      className="relative isolate flex max-w-sm flex-col gap-2 rounded-[1.75rem] bg-[radial-gradient(80%_70%_at_50%_0%,var(--glow-faint),transparent)] p-3 shadow-(--edge)"
    >
      {notifications.map(({ title, body }) => (
        <div
          key={title}
          className="flex gap-3 rounded-[1.25rem] bg-(--popover) p-3 shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_12px_30px_-12px_rgb(0_0_0/0.8)]"
        >
          <LogoMark className="mt-0.5 size-9 rounded-[0.6rem]" />
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <p className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-(--ink)">{title}</span>
              <span className="shrink-0 text-xs text-(--ink-3)">{now}</span>
            </p>
            <p className="mt-0.5 truncate text-(--ink-2)">{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

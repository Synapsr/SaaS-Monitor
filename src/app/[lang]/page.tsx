import type { ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Apps } from "@/components/site/apps";
import { Closing } from "@/components/site/closing";
import { Features } from "@/components/site/features";
import { Hero } from "@/components/site/hero";
import { JsonLd } from "@/components/site/json-ld";
import { OpenSource } from "@/components/site/open-source";
import { Pricing } from "@/components/site/pricing";
import { ProofBar } from "@/components/site/proof-bar";
import { Questions } from "@/components/site/questions";
import { SetupSteps } from "@/components/site/setup-steps";
import { SitePage } from "@/components/site/site-page";
import { Sounds } from "@/components/site/sounds";
import { sitePageMetadata } from "@/lib/marketing/page-metadata";
import { formatCount, regionName } from "@/lib/site/format";
import { siteText } from "@/lib/site/i18n";
import { INTL_LOCALES, isSiteLanguage } from "@/lib/site/languages";
import { demoPath, demoPoster, localizedPath } from "@/lib/site/paths";
import { siteLinks } from "@/lib/site/rich-text";
import { homeJsonLd } from "@/lib/structured-data";
import { repositoryStars } from "@/server/github";

/** The star count is GitHub's, fetched again at most every hour. */
export const revalidate = 3600;

export async function generateMetadata(
  { params }: PageProps<"/[lang]">,
  parent: ResolvingMetadata,
) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();
  const { meta } = siteText(lang);
  return sitePageMetadata(
    {
      title: meta.title,
      absoluteTitle: true,
      description: meta.description,
      path: "/",
      language: lang,
    },
    parent,
  );
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();
  const text = siteText(lang);
  const locale = INTL_LOCALES[lang];
  const links = siteLinks(lang);
  const count = await repositoryStars();
  const stars = count === null ? null : formatCount(count, locale);

  return (
    <SitePage language={lang} path="/">
      <JsonLd
        data={homeJsonLd({
          language: lang,
          description: text.meta.description,
          appDescription: text.apps.lead,
          questions: text.faq.items,
        })}
      />
      <Hero
        text={text}
        demo={demoPath(lang)}
        embed={demoPath(lang, { preview: "1" })}
        poster={demoPoster(lang)}
      />
      <ProofBar text={text.proof} stars={stars} />
      <Features text={text.features} locale={locale} />
      <Sounds
        text={text.sounds}
        locale={locale}
        files={localizedPath(lang, "/stripe-notification-sound")}
      />
      <Apps text={text.apps} />
      <SetupSteps text={text.steps} />
      <Pricing text={text.pricing} />
      <OpenSource text={text.openSource} stars={stars} links={links} />
      <Questions text={text.faq} country={regionName("FR", locale)} links={links} />
      <Closing text={text.closing} stars={stars} />
    </SitePage>
  );
}

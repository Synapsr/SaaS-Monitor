import type { Metadata } from "next";
import { lang } from "next/root-params";
import { NotFoundContent } from "@/components/site/not-found-content";
import { SitePage } from "@/components/site/site-page";
import { siteText } from "@/lib/site/i18n";
import { DEFAULT_LANGUAGE, isSiteLanguage } from "@/lib/site/languages";
import { demoPath, localizedPath } from "@/lib/site/paths";

export const metadata: Metadata = { robots: { index: false } };

/** A page of the site that doesn't exist, in the language of its address. */
export default async function SiteNotFound() {
  const value = await lang();
  const language = isSiteLanguage(value) ? value : DEFAULT_LANGUAGE;
  const text = siteText(language);
  return (
    <SitePage language={language} path="/">
      <title>{`${text.notFound.title} · SaaS Monitor`}</title>
      <NotFoundContent
        text={text.notFound}
        home={localizedPath(language, "/")}
        demo={demoPath(language)}
      />
    </SitePage>
  );
}

import type { Metadata, ResolvingMetadata } from "next";
import { DOCS_PAGE_COMPONENTS } from "@/components/docs/pages";
import { sitePageMetadata } from "@/lib/marketing/page-metadata";
import { docsText } from "@/lib/site/docs";
import { DOCS_TEXT_KEYS, docsPath, type DocsPage } from "@/lib/site/docs/pages";
import { siteText } from "@/lib/site/i18n";
import { isSiteLanguage } from "@/lib/site/languages";
import { siteLinks } from "@/lib/site/rich-text";

/*
 * What the routes of the docs (`app/[lang]/docs`) render, kept here so that they stay thin: a page
 * of the docs in the language of its address, or `null` for a language the site doesn't speak.
 */

export async function docsPageMetadata(
  lang: string,
  page: DocsPage,
  parent: ResolvingMetadata,
): Promise<Metadata | null> {
  if (!isSiteLanguage(lang)) return null;
  const { meta } = docsText(lang)[DOCS_TEXT_KEYS[page]];
  return sitePageMetadata(
    { title: meta.title, description: meta.description, path: docsPath(page), language: lang },
    parent,
  );
}

export function renderDocsPage(lang: string, page: DocsPage): React.ReactNode | null {
  if (!isSiteLanguage(lang)) return null;
  const Page = DOCS_PAGE_COMPONENTS[page];
  return (
    <Page language={lang} text={docsText(lang)} site={siteText(lang)} links={siteLinks(lang)} />
  );
}

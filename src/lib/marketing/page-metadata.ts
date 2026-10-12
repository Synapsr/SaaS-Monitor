import type { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/lib/site";
import {
  DEFAULT_LANGUAGE,
  OPEN_GRAPH_LOCALES,
  SITE_LANGUAGES,
  type SiteLanguage,
} from "@/lib/site/languages";
import { canonicalUrl, isTranslatedPath, languageAlternates } from "@/lib/site/paths";

/**
 * Where the site is served, as the root layout's `metadataBase` sees it: `APP_URL` at build time.
 * Docker builds may pass it empty.
 */
export function siteUrl(): URL {
  return new URL(process.env.APP_URL || "http://localhost:3000");
}

export interface SitePageMetadata {
  title: string;
  /** The home page's title stands alone, without the site's name after it. */
  absoluteTitle?: boolean;
  description: string;
  /** The page's address in English: `/changelog`. */
  path: `/${string}`;
  /** The page's language: English for pages that are only in English. */
  language?: SiteLanguage;
  /** Other formats of the page, e.g. `{ "application/rss+xml": "/changelog/rss.xml" }`. */
  types?: Record<string, string>;
}

/**
 * Title, description, canonical address, languages and social preview of a page of the site.
 * Canonical addresses are always on saas-monitor.com: a self-hosted instance serves a copy of
 * the site, which search engines should credit to the original. A page's `openGraph` replaces
 * its parent's whole, image included: the language's image (`[lang]/opengraph-image.tsx`) is
 * carried over from the parent.
 */
export async function sitePageMetadata(
  page: SitePageMetadata,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { openGraph } = await parent;
  const language = page.language ?? DEFAULT_LANGUAGE;
  const languages = isTranslatedPath(page.path) ? languageAlternates(page.path) : null;
  const translated = languages !== null;
  const url = canonicalUrl(language, page.path);
  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: {
      canonical: url,
      ...(languages && { languages }),
      ...(page.types && { types: page.types }),
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: page.title,
      description: page.description,
      url,
      locale: OPEN_GRAPH_LOCALES[language],
      ...(translated && {
        alternateLocale: SITE_LANGUAGES.filter((other) => other !== language).map(
          (other) => OPEN_GRAPH_LOCALES[other],
        ),
      }),
      ...(openGraph?.images && { images: openGraph.images }),
    },
  };
}

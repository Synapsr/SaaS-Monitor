import { siteConfig } from "@/lib/site";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_TAGS,
  SITE_LANGUAGES,
  type SiteLanguage,
} from "@/lib/site/languages";

/**
 * The pages of the site in every language. The others (legal pages, changelog, comparisons) are
 * in English only: they keep their address, and take no part in `hreflang`.
 */
export const TRANSLATED_PATHS = ["/", "/stripe-notification-sound"] as const;

export type TranslatedPath = (typeof TRANSLATED_PATHS)[number];

export function isTranslatedPath(path: string): path is TranslatedPath {
  return TRANSLATED_PATHS.some((translated) => translated === path);
}

/** `path` in `language`: `/stripe-notification-sound` in French is `/fr/stripe-notification-sound`. */
export function localizedPath(language: SiteLanguage, path: `/${string}`): `/${string}` {
  if (language === DEFAULT_LANGUAGE) return path;
  return path === "/" ? `/${language}` : `/${language}${path}`;
}

/**
 * Where a page is in another language: the same page when it is translated, else that language's
 * home page.
 */
export function pathIn(language: SiteLanguage, path: `/${string}`): `/${string}` {
  return localizedPath(language, isTranslatedPath(path) ? path : "/");
}

/** The live demo, speaking `language`: its own address, outside the site's languages. */
export function demoPath(language: SiteLanguage, query: Record<string, string> = {}): string {
  const params = new URLSearchParams(query);
  if (language !== DEFAULT_LANGUAGE) params.set("lang", language);
  const search = params.toString();
  return search ? `/d/demo?${search}` : "/d/demo";
}

/**
 * The live demo's picture, shown before it loads and on phones instead of it: `/d/demo?preview=1`
 * in each language, captured at 1920×1080 (`public/images/demo`).
 */
export function demoPoster(language: SiteLanguage): string {
  return `/images/demo/${language}.webp`;
}

/**
 * The address search engines should keep for a page: always on the hosted site, also from a
 * self-hosted instance, whose copy of the site is not the original.
 */
export function canonicalUrl(language: SiteLanguage, path: `/${string}`): string {
  return absoluteSiteUrl(localizedPath(language, path));
}

function absoluteSiteUrl(path: `/${string}`): string {
  return path === "/" ? `${siteConfig.hostedUrl}/` : `${siteConfig.hostedUrl}${path}`;
}

/**
 * A translated page in every language, by `hreflang`, plus `x-default` (English, unprefixed): for
 * `<link rel="alternate">` and the sitemap.
 */
export function languageAlternates(path: TranslatedPath): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const language of SITE_LANGUAGES) {
    alternates[LANGUAGE_TAGS[language]] = canonicalUrl(language, path);
  }
  alternates["x-default"] = canonicalUrl(DEFAULT_LANGUAGE, path);
  return alternates;
}

import { DEFAULT_LANGUAGE, LANGUAGE_TAGS, SITE_LANGUAGES } from "@/lib/site/languages";
import { localizedPath, TRANSLATED_PATHS } from "@/lib/site/paths";

export interface SitemapEntry {
  url: string;
  alternates?: { languages: Record<string, string> };
}

/**
 * The sitemap of the instance at `base` (`APP_URL`, without a trailing slash): every translated
 * page in every language, each listing all of them by `hreflang` with English as `x-default`,
 * then `englishPaths`, the pages only written in English.
 */
export function sitemapEntries(base: string, englishPaths: `/${string}`[]): SitemapEntry[] {
  const url = (path: `/${string}`) => (path === "/" ? `${base}/` : `${base}${path}`);
  const translated = TRANSLATED_PATHS.flatMap((path) => {
    const languages: Record<string, string> = {};
    for (const language of SITE_LANGUAGES) {
      languages[LANGUAGE_TAGS[language]] = url(localizedPath(language, path));
    }
    languages["x-default"] = url(localizedPath(DEFAULT_LANGUAGE, path));
    return SITE_LANGUAGES.map((language) => ({
      url: url(localizedPath(language, path)),
      alternates: { languages },
    }));
  });
  return [...translated, ...englishPaths.map((path) => ({ url: url(path) }))];
}

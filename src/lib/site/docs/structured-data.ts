import { siteConfig } from "@/lib/site";
import { docsPath, type DocsPage } from "@/lib/site/docs/pages";
import type { SiteLanguage } from "@/lib/site/languages";
import { breadcrumbList, pageJsonLd, publisher, techArticle } from "@/lib/structured-data";

/**
 * A page of the docs described for search engines and assistants: an article by the maker of
 * SaaS Monitor, where it sits on the site, and what else the page holds (`extra`, such as the
 * steps of a how-to).
 */
export function docsJsonLd({
  language,
  page,
  title,
  description,
  names,
  image,
  extra = [],
}: {
  language: SiteLanguage;
  page: DocsPage;
  title: string;
  description: string;
  /** The docs' name and the page's, in the page's language, for the breadcrumb. */
  names: { docs: string; page: string };
  /** On the site: `/images/demo/en.webp`. */
  image?: string;
  extra?: object[];
}) {
  const path = docsPath(page);
  const steps = [
    { name: siteConfig.name, path: "/" as const },
    { name: names.docs, path: docsPath("overview") },
    ...(page === "overview" ? [] : [{ name: names.page, path }]),
  ];
  return pageJsonLd([
    publisher(),
    techArticle({ language, path, title, description, image }),
    breadcrumbList(language, steps),
    ...extra,
  ]);
}

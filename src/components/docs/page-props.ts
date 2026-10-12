import type { DocsText } from "@/lib/site/docs";
import type { SiteText } from "@/lib/site/i18n";
import type { SiteLanguage } from "@/lib/site/languages";

/** What every page of the docs renders from: its language, its words and the site's. */
export interface DocsPageProps {
  language: SiteLanguage;
  text: DocsText;
  site: SiteText;
  /** Where the links of the texts point (`siteLinks()`). */
  links: Record<string, string>;
}

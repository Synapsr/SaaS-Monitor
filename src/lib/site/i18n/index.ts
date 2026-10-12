import "server-only";
import type { SiteLanguage } from "@/lib/site/languages";
import { de } from "./de";
import { en, type SiteText } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { nl } from "./nl";
import { pt } from "./pt";

export type { SiteText };

/**
 * The site's words in each language. Server-side only: pages render them, and pass client
 * components the few they need, so that no visitor downloads seven languages.
 */
export const siteTexts: Record<SiteLanguage, SiteText> = { en, fr, de, es, it, pt, nl };

export function siteText(language: SiteLanguage): SiteText {
  return siteTexts[language];
}

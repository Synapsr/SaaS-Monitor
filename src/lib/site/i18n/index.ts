import "server-only";
import type { SiteLanguage } from "@/lib/site/languages";
import { en, type SiteText } from "./en";

export type { SiteText };

/**
 * The site's words in each language. Server-side only: pages render them, and pass client
 * components the few they need, so that no visitor downloads seven languages.
 */
export const siteTexts: Record<SiteLanguage, SiteText> = {
  en,
  fr: en,
  de: en,
  es: en,
  it: en,
  pt: en,
  nl: en,
};

export function siteText(language: SiteLanguage): SiteText {
  return siteTexts[language];
}

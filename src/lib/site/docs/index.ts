import "server-only";
import type { SiteLanguage } from "@/lib/site/languages";
import { de } from "./de";
import { en, type DocsText } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { nl } from "./nl";
import { pt } from "./pt";

export type { DocsText };

/** The docs' words in each language, rendered on the server like the rest of the site. */
export const docsTexts: Record<SiteLanguage, DocsText> = { en, fr, de, es, it, pt, nl };

export function docsText(language: SiteLanguage): DocsText {
  return docsTexts[language];
}

import { LANGUAGES, type Language } from "@/lib/screens/options";

/**
 * The languages of the public site: those of screens, so that a founder reads about a screen in
 * the language it will speak. English is the default, served without a prefix (`/`); the others
 * under theirs (`/fr`). The dashboard stays in English.
 */
export const SITE_LANGUAGES = LANGUAGES;

export type SiteLanguage = Language;

export const DEFAULT_LANGUAGE = "en" satisfies SiteLanguage;

export function isSiteLanguage(value: string | undefined): value is SiteLanguage {
  return SITE_LANGUAGES.some((language) => language === value);
}

/** BCP 47 tags, for `<html lang>` and `hreflang`: the site's Portuguese is Brazil's. */
export const LANGUAGE_TAGS: Record<SiteLanguage, string> = {
  en: "en",
  fr: "fr",
  de: "de",
  es: "es",
  it: "it",
  pt: "pt-BR",
  nl: "nl",
};

/** Locales of numbers and dates (`Intl`), as screens write them (`src/lib/display/i18n`). */
export const INTL_LOCALES: Record<SiteLanguage, string> = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  nl: "nl-NL",
};

/** Locales of social previews (`og:locale`). */
export const OPEN_GRAPH_LOCALES: Record<SiteLanguage, string> = {
  en: "en_US",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
  it: "it_IT",
  pt: "pt_BR",
  nl: "nl_NL",
};

/** Each language in itself, as the language switcher lists them. */
export const LANGUAGE_NAMES: Record<SiteLanguage, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português (Brasil)",
  nl: "Nederlands",
};

/**
 * The site language a browser prefers, from `navigator.languages` (`["fr-CH", "en"]`): the first
 * whose primary subtag the site speaks. `null` when it speaks none of them.
 */
export function preferredLanguage(languages: readonly string[]): SiteLanguage | null {
  for (const tag of languages) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isSiteLanguage(primary)) return primary;
  }
  return null;
}

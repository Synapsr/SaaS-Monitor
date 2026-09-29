import type { Language } from "@/lib/screens/settings";
import { de } from "./de";
import { en, type DisplayText } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { nl } from "./nl";
import { pt } from "./pt";

export type { DisplayText };

/**
 * How a screen speaks: its words, and the locale of its numbers and dates ("12 480 €" in French).
 * Only screens are translated: the dashboard of a founder is in English.
 */
export interface DisplayLocale {
  language: Language;
  /** BCP 47 tag for `Intl`. */
  locale: string;
  text: DisplayText;
}

const TEXTS: Record<Language, DisplayText> = { en, fr, de, es, it, pt, nl };

const LOCALES: Record<Language, string> = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  nl: "nl-NL",
};

/** Each language in itself, as the screen settings list them. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português (Brasil)",
  nl: "Nederlands",
};

const displayLocales = new Map<Language, DisplayLocale>();

/** The same object for the same language, so that it can be a dependency of memoized values. */
export function displayLocale(language: Language): DisplayLocale {
  let value = displayLocales.get(language);
  if (!value) {
    value = { language, locale: LOCALES[language], text: TEXTS[language] };
    displayLocales.set(language, value);
  }
  return value;
}

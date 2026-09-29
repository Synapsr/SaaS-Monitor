import { createContext, use } from "react";
import { displayLocale, type DisplayLocale } from "@/lib/display/i18n";

/** The language of the screen on display, provided by `Display` to everything it renders. */
export const DisplayLocaleContext = createContext<DisplayLocale>(displayLocale("en"));

/** How the screen speaks: its words (`text`) and the locale of its numbers and dates. */
export function useDisplayLocale(): DisplayLocale {
  return use(DisplayLocaleContext);
}

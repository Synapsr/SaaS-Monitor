import { createContext, use, useMemo, type ReactNode } from "react";
import { displayLocale, type DisplayLocale } from "@/contract/display/i18n";
import type { Accent, Language, Theme } from "@/contract/screens/settings";
import { displayPalette, type DisplayPalette } from "@/display/palette";

/**
 * - `phone`: a screen in portrait on a phone or tablet, scrolled like a page.
 * - `wall`: landscape, the "TV mode": everything at once, like the wall display.
 */
export type DisplayLayout = "phone" | "wall";

export interface DisplayContextValue {
  /** The screen's words and the locale of its numbers and dates. */
  locale: DisplayLocale;
  palette: DisplayPalette;
  layout: DisplayLayout;
  /** Multiplies the display's sizes: 1 on a phone, more on larger screens. */
  scale: number;
}

const DisplayContext = createContext<DisplayContextValue | null>(null);

interface DisplayProviderProps {
  language: Language;
  theme: Theme;
  accent: Accent;
  layout: DisplayLayout;
  scale: number;
  children: ReactNode;
}

/** A screen speaks its language and wears its colors: display components read them here. */
export function DisplayProvider({
  language,
  theme,
  accent,
  layout,
  scale,
  children,
}: DisplayProviderProps) {
  const value = useMemo(
    () => ({
      locale: displayLocale(language),
      palette: displayPalette(theme, accent),
      layout,
      scale,
    }),
    [language, theme, accent, layout, scale],
  );
  return <DisplayContext value={value}>{children}</DisplayContext>;
}

export function useDisplay(): DisplayContextValue {
  const value = use(DisplayContext);
  if (!value) throw new Error("useDisplay() is only available inside a DisplayProvider");
  return value;
}

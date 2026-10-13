import { createContext, use, useMemo, type ReactNode } from "react";
import { displayLocale, type DisplayLocale } from "@/contract/display/i18n";
import type { Accent, Language, Theme } from "@/contract/screens/settings";
import { displayPalette, type DisplayPalette } from "@/display/palette";
import { useReducedMotion } from "@/lib/use-reduced-motion";

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
  /**
   * Drawn for an image: nothing moves, and text keeps its size whatever the device's Dynamic Type,
   * as the image is seen elsewhere.
   */
  still: boolean;
}

const DisplayContext = createContext<DisplayContextValue | null>(null);

interface DisplayProviderProps {
  language: Language;
  theme: Theme;
  accent: Accent;
  layout: DisplayLayout;
  scale: number;
  still?: boolean;
  children: ReactNode;
}

/** A screen speaks its language and wears its colors: display components read them here. */
export function DisplayProvider({
  language,
  theme,
  accent,
  layout,
  scale,
  still = false,
  children,
}: DisplayProviderProps) {
  const value = useMemo(
    () => ({
      locale: displayLocale(language),
      palette: displayPalette(theme, accent),
      layout,
      scale,
      still,
    }),
    [language, theme, accent, layout, scale, still],
  );
  return <DisplayContext value={value}>{children}</DisplayContext>;
}

export function useDisplay(): DisplayContextValue {
  const value = use(DisplayContext);
  if (!value) throw new Error("useDisplay() is only available inside a DisplayProvider");
  return value;
}

/** Animations play unless the system asks for less motion, or the display is drawn for an image. */
export function useStillDisplay(): boolean {
  const reducedMotion = useReducedMotion();
  return useDisplay().still || reducedMotion;
}

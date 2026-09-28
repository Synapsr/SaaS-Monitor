import { ACCENT_PALETTES } from "@/lib/display/accents";

/**
 * Brand colors for what stylesheets cannot reach: the logo's SVG, the social preview image and
 * the browser theme of screens. Stylesheets use the same values (`src/app/wall-palette.css`).
 */
export const BRAND_COLORS = {
  /** The logo's pulse: emerald, the default accent of screens. */
  glow: ACCENT_PALETTES.emerald.base,
  /** Background of screens and of the landing page. */
  screen: "#08090b",
  ink: "#f4f5f7",
  /** The logo's tile, as drawn by `src/app/icon.svg`. */
  tile: "#0a0a0a",
} as const;

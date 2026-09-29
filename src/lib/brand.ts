import { PRESET_ACCENTS } from "@/lib/display/accents";

/**
 * Brand colors for what stylesheets cannot reach: the logo's SVG, the social preview image and
 * the browser theme of screens. Stylesheets use the same values (`src/app/wall-palette.css`).
 */
export const BRAND_COLORS = {
  /** The logo's pulse: emerald, the default accent of screens. */
  glow: PRESET_ACCENTS.emerald.dark.glow,
  /** Background of screens and of the landing page. */
  screen: "#08090b",
  ink: "#f4f5f7",
  /** The logo's tile, as drawn by `src/app/icon.svg`. */
  tile: "#0a0a0a",
} as const;

/** The logo's pulse line, in a 64×64 view box (`src/app/icon.svg` draws it too). */
export const LOGO_PULSE_PATH = "M12 40h9l6-16 8 24 6-14h11";

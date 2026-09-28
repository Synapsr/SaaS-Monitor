import type { Viewport } from "next";
import { BRAND_COLORS } from "@/lib/brand";
import "./display.css";

export const viewport: Viewport = {
  themeColor: BRAND_COLORS.screen,
  colorScheme: "dark",
};

/** Wall displays: public, full-screen pages with their own styles (see `display.css`). */
export default function DisplayLayout({ children }: LayoutProps<"/d">) {
  return children;
}

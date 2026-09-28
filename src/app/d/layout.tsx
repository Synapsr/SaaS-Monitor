import type { Viewport } from "next";
import "./display.css";

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
};

/** Wall displays: public, full-screen pages with their own styles (see `display.css`). */
export default function DisplayLayout({ children }: LayoutProps<"/d">) {
  return children;
}

import type { MetadataRoute } from "next";
import { appUrl } from "@/env";
import { absoluteUrl } from "@/lib/site";

/** The public pages worth finding in search engines. Screens and the dashboard are private. */
const PUBLIC_PAGES = [
  "/",
  "/stripe-notification-sound",
  "/alternatives",
  "/changelog",
  "/privacy",
  "/terms",
  "/legal",
  "/sign-up",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return PUBLIC_PAGES.map((path) => ({ url: absoluteUrl(base, path) }));
}

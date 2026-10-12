import type { MetadataRoute } from "next";
import { appUrl } from "@/env";
import { ALTERNATIVES } from "@/lib/marketing/alternatives";
import { sitemapEntries } from "@/lib/site/sitemap";

/**
 * The public pages worth finding in search engines, each translated one in every language with
 * its alternates. Screens, the dashboard and the auth pages are left out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(appUrl(), [
    "/alternatives",
    ...ALTERNATIVES.map(({ slug }) => `/alternatives/${slug}` as const),
    "/changelog",
    "/privacy",
    "/terms",
    "/legal",
  ]);
}

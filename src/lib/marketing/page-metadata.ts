import type { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/lib/site";

/**
 * Where the site is served, as the root layout's `metadataBase` sees it: `APP_URL` at build time.
 * Docker builds may pass it empty.
 */
export function siteUrl(): URL {
  return new URL(process.env.APP_URL || "http://localhost:3000");
}

export interface ContentPageMetadata {
  title: string;
  description: string;
  /** The page's path, its canonical URL: `/changelog`. */
  path: `/${string}`;
  /** Other formats of the page, e.g. `{ "application/rss+xml": "/changelog/rss.xml" }`. */
  types?: Record<string, string>;
}

/**
 * Title, description, canonical URL and social preview of a marketing page. A page's `openGraph`
 * replaces its parent's whole, image included: the site's image (`src/app/opengraph-image.tsx`)
 * is carried over from the parent.
 */
export async function contentMetadata(
  page: ContentPageMetadata,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { openGraph } = await parent;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path, ...(page.types && { types: page.types }) },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: page.title,
      description: page.description,
      url: page.path,
      ...(openGraph?.images && { images: openGraph.images }),
    },
  };
}

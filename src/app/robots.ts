import type { MetadataRoute } from "next";

/**
 * Screens, the dashboard and invitations are private: only the landing page may be indexed. The
 * demo may be fetched, so that a link to it shared on X or LinkedIn gets a card: their crawlers
 * follow robots.txt, where the longest matching rule wins. It stays out of search results through
 * its `noindex`, like the screens whose token would happen to start with "demo".
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/d/demo"],
      disallow: ["/app", "/d/", "/api/", "/invite/"],
    },
  };
}

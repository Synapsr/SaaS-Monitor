import type { MetadataRoute } from "next";
import { appUrl } from "@/env";

// Screens, the dashboard and invitations are private: only the landing page may be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/d/", "/api/", "/invite/"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}

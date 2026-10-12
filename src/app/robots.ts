import type { MetadataRoute } from "next";
import { appUrl } from "@/env";

/**
 * Assistants that answer with the web, and the crawlers that train them: named so that the site
 * says, beyond doubt, that they may read it. Their groups replace the general one, so they repeat
 * its rules.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "meta-externalagent",
  "MistralAI-User",
  "DuckAssistBot",
];

/**
 * The public site may be read by everyone. Screens, the dashboard, the API and invitations are
 * private. The demo may be fetched, so that a link to it shared on X or LinkedIn gets a card:
 * their crawlers follow robots.txt, where the longest matching rule wins. It stays out of search
 * results through its `noindex`, like the screens whose token would happen to start with "demo".
 */
export default function robots(): MetadataRoute.Robots {
  const rule = {
    allow: ["/", "/d/demo"],
    disallow: ["/app", "/d/", "/api/", "/invite/"],
  };
  return {
    rules: [
      { userAgent: "*", ...rule },
      { userAgent: AI_CRAWLERS, ...rule },
    ],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}

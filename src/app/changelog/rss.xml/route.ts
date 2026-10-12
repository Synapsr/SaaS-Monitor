import { changelogFeed } from "@/lib/marketing/rss";
import { siteUrl } from "@/lib/marketing/page-metadata";
import { siteConfig } from "@/lib/site";
import { readChangelog } from "@/server/changelog";

/** Written at build time, from CHANGELOG.md: a release is a new build. */
export const dynamic = "force-static";

export async function GET() {
  const feed = changelogFeed(await readChangelog(), { name: siteConfig.name, siteUrl: siteUrl() });
  return new Response(feed, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

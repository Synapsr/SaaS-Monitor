import { blocksHtml, releasedVersions, type Changelog } from "./changelog";

/** RSS 2.0 for `/changelog/rss.xml`: one item per released version, newest first. */

export interface ChangelogFeedOptions {
  /** The product's name, e.g. "SaaS Monitor". */
  name: string;
  /** Where the site is served, for the absolute links feed readers need. */
  siteUrl: URL;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822, as RSS dates are written: `Tue, 29 Sep 2026 00:00:00 GMT`. */
function rssDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toUTCString();
}

export function changelogFeed(
  changelog: Changelog,
  { name, siteUrl }: ChangelogFeedOptions,
): string {
  const page = new URL("/changelog", siteUrl).href;
  const self = new URL("/changelog/rss.xml", siteUrl).href;
  const releases = releasedVersions(changelog);
  const items = releases.map((release) => {
    const link = `${page}#${release.anchor}`;
    return [
      "    <item>",
      `      <title>${escapeXml(`${name} ${release.version}`)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${rssDate(release.date!)}</pubDate>`,
      `      <description>${escapeXml(blocksHtml(release.blocks))}</description>`,
      "    </item>",
    ].join("\n");
  });

  // Dated by the newest release rather than the build: rebuilding changes nothing for readers.
  const updated = releases[0]?.date;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${name} changelog`)}</title>`,
    `    <link>${escapeXml(page)}</link>`,
    `    <description>${escapeXml(`New features and fixes in each release of ${name}.`)}</description>`,
    "    <language>en</language>",
    ...(updated ? [`    <lastBuildDate>${rssDate(updated)}</lastBuildDate>`] : []),
    `    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

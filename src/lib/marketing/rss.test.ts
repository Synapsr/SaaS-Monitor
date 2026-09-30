import { describe, expect, it } from "vitest";
import { parseChangelog } from "./changelog";
import { changelogFeed, escapeXml } from "./rss";

const changelog = parseChangelog(`# Changelog

## [Unreleased]

- Not out yet.

## [1.1.0] - 2026-09-29

- Screens say **why** <subscriptions> stop.

## [1.0.0] - 2026-09-28

The first public release.
`);

const feed = changelogFeed(changelog, {
  name: "SaaS Monitor",
  siteUrl: new URL("https://saas-monitor.example"),
});

describe("changelogFeed", () => {
  it("has one item per released version, newest first, linked to its anchor", () => {
    const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].map(([item]) => item);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("<title>SaaS Monitor 1.1.0</title>");
    expect(items[0]).toContain("<link>https://saas-monitor.example/changelog#v1.1.0</link>");
    expect(items[0]).toContain(
      '<guid isPermaLink="true">https://saas-monitor.example/changelog#v1.1.0</guid>',
    );
    expect(items[0]).toContain("<pubDate>Tue, 29 Sep 2026 00:00:00 GMT</pubDate>");
    expect(items[1]).toContain("<title>SaaS Monitor 1.0.0</title>");
    expect(feed).not.toContain("Not out yet");
  });

  it("escapes each release's HTML into its description", () => {
    expect(feed).toContain(
      "<description>&lt;ul&gt;&lt;li&gt;Screens say &lt;strong&gt;why&lt;/strong&gt; &amp;lt;subscriptions&amp;gt; stop.&lt;/li&gt;&lt;/ul&gt;</description>",
    );
  });

  it("describes the channel, dated by its newest release", () => {
    expect(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(
      true,
    );
    expect(feed).toContain("<title>SaaS Monitor changelog</title>");
    expect(feed).toContain("<link>https://saas-monitor.example/changelog</link>");
    expect(feed).toContain("<lastBuildDate>Tue, 29 Sep 2026 00:00:00 GMT</lastBuildDate>");
    expect(feed).toContain(
      '<atom:link href="https://saas-monitor.example/changelog/rss.xml" rel="self" type="application/rss+xml" />',
    );
  });
});

describe("escapeXml", () => {
  it("escapes the five XML entities", () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;",
    );
  });
});

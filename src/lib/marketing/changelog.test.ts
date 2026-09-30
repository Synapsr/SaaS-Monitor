import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blocksHtml, inlineText, parseChangelog, parseInline, releasedVersions } from "./changelog";

const SAMPLE = `# Changelog

Notable changes, newest first. Versions follow [semantic versioning](https://semver.org).

## [Unreleased]

### Added

- Lost subscriptions say why: canceled, won't renew
  (a cancellation at period end) or paused.
- **Events**, in the screen settings.

## [1.1.0] - 2026-09-29

### Fixed

- In development, new columns show up without a restart (\`pnpm dev\`).

## [1.0.0] - 2026-09-28

The first public release.
On to the next one.

### Screens

- A dark or light theme.

[Unreleased]: https://github.com/Synapsr/SaaS-Monitor/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Synapsr/SaaS-Monitor/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Synapsr/SaaS-Monitor/releases/tag/v1.0.0
`;

describe("parseInline", () => {
  it("reads bold, inline code and links, and leaves the rest as text", () => {
    expect(
      parseInline("See **Re-import `data`** in [the docs](https://example.com/docs)."),
    ).toEqual([
      { type: "text", text: "See " },
      {
        type: "strong",
        children: [
          { type: "text", text: "Re-import " },
          { type: "code", text: "data" },
        ],
      },
      { type: "text", text: " in " },
      {
        type: "link",
        href: "https://example.com/docs",
        children: [{ type: "text", text: "the docs" }],
      },
      { type: "text", text: "." },
    ]);
  });

  it("keeps Markdown characters inside code as they are", () => {
    expect(parseInline("`**not bold**`")).toEqual([{ type: "code", text: "**not bold**" }]);
  });

  it("links references, and leaves unknown ones and unsafe links as text", () => {
    const references = new Map([["1.1.0", "https://example.com/1.1.0"]]);
    expect(parseInline("[1.1.0] and [2.0.0]", references)).toEqual([
      {
        type: "link",
        href: "https://example.com/1.1.0",
        children: [{ type: "text", text: "1.1.0" }],
      },
      { type: "text", text: " and [2.0.0]" },
    ]);
    expect(parseInline("[click](javascript:alert(1))")).toEqual([
      { type: "text", text: "[click](javascript:alert(1))" },
    ]);
  });
});

describe("parseChangelog", () => {
  const changelog = parseChangelog(SAMPLE);

  it("reads the introduction, then each release with its date and link", () => {
    expect(changelog.intro).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "text", text: "Notable changes, newest first. Versions follow " },
          {
            type: "link",
            href: "https://semver.org",
            children: [{ type: "text", text: "semantic versioning" }],
          },
          { type: "text", text: "." },
        ],
      },
    ]);
    expect(
      changelog.releases.map(({ version, date, url, anchor }) => ({ version, date, url, anchor })),
    ).toEqual([
      {
        version: "Unreleased",
        date: null,
        url: "https://github.com/Synapsr/SaaS-Monitor/compare/v1.1.0...HEAD",
        anchor: "unreleased",
      },
      {
        version: "1.1.0",
        date: "2026-09-29",
        url: "https://github.com/Synapsr/SaaS-Monitor/compare/v1.0.0...v1.1.0",
        anchor: "v1.1.0",
      },
      {
        version: "1.0.0",
        date: "2026-09-28",
        url: "https://github.com/Synapsr/SaaS-Monitor/releases/tag/v1.0.0",
        anchor: "v1.0.0",
      },
    ]);
  });

  it("joins the wrapped lines of a bullet or a paragraph", () => {
    const [heading, list] = changelog.releases[0].blocks;
    expect(heading).toEqual({ type: "heading", children: [{ type: "text", text: "Added" }] });
    expect(list.type).toBe("list");
    const items = list.type === "list" ? list.items : [];
    expect(items.map(inlineText)).toEqual([
      "Lost subscriptions say why: canceled, won't renew (a cancellation at period end) or paused.",
      "Events, in the screen settings.",
    ]);
    expect(changelog.releases[2].blocks[0]).toEqual({
      type: "paragraph",
      children: [{ type: "text", text: "The first public release. On to the next one." }],
    });
  });

  it("leaves the link definitions out of the last release", () => {
    expect(blocksHtml(changelog.releases[2].blocks)).toBe(
      "<p>The first public release. On to the next one.</p>\n<h3>Screens</h3>\n<ul><li>A dark or light theme.</li></ul>",
    );
  });

  it("reads the project's own changelog", () => {
    const own = parseChangelog(readFileSync("CHANGELOG.md", "utf8"));
    const released = releasedVersions(own);
    expect(released.length).toBeGreaterThan(0);
    for (const release of released) {
      expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(release.url).toMatch(/^https:\/\//);
      expect(release.blocks.length).toBeGreaterThan(0);
    }
  });
});

describe("blocksHtml", () => {
  it("escapes text and attributes", () => {
    expect(
      blocksHtml([
        {
          type: "paragraph",
          children: [
            { type: "text", text: "<b> & " },
            { type: "link", href: 'https://example.com/?a="1"&b', children: [] },
          ],
        },
      ]),
    ).toBe('<p>&lt;b&gt; &amp; <a href="https://example.com/?a=&quot;1&quot;&amp;b"></a></p>');
  });
});

describe("releasedVersions", () => {
  it("leaves out what is not released yet", () => {
    expect(releasedVersions(parseChangelog(SAMPLE)).map((release) => release.version)).toEqual([
      "1.1.0",
      "1.0.0",
    ]);
  });
});

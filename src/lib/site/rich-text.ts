import { siteConfig } from "@/lib/site";
import { DOCS_PAGES, docsPath, GITHUB_DOCS, type DocsPage } from "@/lib/site/docs/pages";
import type { SiteLanguage } from "@/lib/site/languages";
import { demoPath, localizedPath } from "@/lib/site/paths";

/**
 * The little markup of the site's texts, so that translations carry their links and emphasis
 * where their own sentences put them: `[words](key)` links the words to `siteLinks()[key]`,
 * `**words**` stresses them (a menu's name, in steps to follow), and `` `words` `` sets them as
 * code (a setting, a command or a key, as typed).
 */
export type RichTextPart =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; key: string };

const MARKUP = /\[([^\]]+)\]\(([a-z-]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

export function parseRichText(text: string): RichTextPart[] {
  const parts: RichTextPart[] = [];
  let index = 0;
  for (const match of text.matchAll(MARKUP)) {
    if (match.index > index) parts.push({ type: "text", text: text.slice(index, match.index) });
    if (match[3] !== undefined) parts.push({ type: "strong", text: match[3] });
    else if (match[4] !== undefined) parts.push({ type: "code", text: match[4] });
    else parts.push({ type: "link", text: match[1], key: match[2] });
    index = match.index + match[0].length;
  }
  if (index < text.length) parts.push({ type: "text", text: text.slice(index) });
  return parts;
}

/** The text without its markup: for structured data and plain-text documents. */
export function plainText(text: string): string {
  return parseRichText(text)
    .map((part) => part.text)
    .join("");
}

/**
 * Where the keys of links point, from a page in `language`. The site's own pages come first, in
 * the page's language: the docs (`doc-get-started`…), which lead on to the guides on GitHub.
 */
export function siteLinks(language: SiteLanguage): Record<string, string> {
  const doc = (page: DocsPage, anchor = "") =>
    `${localizedPath(language, docsPath(page))}${anchor}`;
  return {
    ...Object.fromEntries(
      DOCS_PAGES.map((page) => [page === "overview" ? "docs" : `doc-${page}`, doc(page)]),
    ),
    permissions: doc("get-started", "#permissions"),
    mrr: doc("numbers", "#mrr"),
    wall: doc("wall-display"),
    "self-hosting": doc("self-hosting"),
    demo: demoPath(language),
    privacy: "/privacy",
    issues: `${siteConfig.repositoryUrl}/issues`,
    "install-script": GITHUB_DOCS.installScript,
    "github-docs": GITHUB_DOCS.docs,
    louez: `${siteConfig.maker.githubUrl}/Louez`,
    hovod: `${siteConfig.maker.githubUrl}/Hovod`,
    sounds: localizedPath(language, "/stripe-notification-sound"),
    apps: `${localizedPath(language, "/")}#apps`,
    synapsr: siteConfig.maker.url,
    support: `mailto:${siteConfig.supportEmail}`,
  };
}

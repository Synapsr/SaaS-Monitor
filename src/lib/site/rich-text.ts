import { siteConfig } from "@/lib/site";
import type { SiteLanguage } from "@/lib/site/languages";
import { localizedPath } from "@/lib/site/paths";

/**
 * The little markup of the site's texts, so that translations carry their links and emphasis
 * where their own sentences put them: `[words](key)` links the words to `siteLinks()[key]`, and
 * `**words**` stresses them (a menu's name, in steps to follow).
 */
export type RichTextPart =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; key: string };

const MARKUP = /\[([^\]]+)\]\(([a-z-]+)\)|\*\*([^*]+)\*\*/g;

export function parseRichText(text: string): RichTextPart[] {
  const parts: RichTextPart[] = [];
  let index = 0;
  for (const match of text.matchAll(MARKUP)) {
    if (match.index > index) parts.push({ type: "text", text: text.slice(index, match.index) });
    if (match[3] !== undefined) parts.push({ type: "strong", text: match[3] });
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

const INSTALL_SCRIPT_URL = `${siteConfig.repositoryUrl}/blob/main/public/install.sh`;

/** Where the keys of links point, from a page in `language`. */
export function siteLinks(language: SiteLanguage): Record<string, string> {
  return {
    permissions: `${siteConfig.stripeDocsUrl}#create-the-key`,
    mrr: `${siteConfig.stripeDocsUrl}#how-mrr-is-computed`,
    wall: siteConfig.wallDisplayDocsUrl,
    issues: `${siteConfig.repositoryUrl}/issues`,
    "self-hosting": siteConfig.selfHostingUrl,
    "install-script": INSTALL_SCRIPT_URL,
    louez: `${siteConfig.maker.githubUrl}/Louez`,
    hovod: `${siteConfig.maker.githubUrl}/Hovod`,
    sounds: localizedPath(language, "/stripe-notification-sound"),
    apps: `${localizedPath(language, "/")}#apps`,
    synapsr: siteConfig.maker.url,
  };
}

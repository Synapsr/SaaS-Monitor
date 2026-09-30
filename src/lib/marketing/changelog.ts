/**
 * Reads CHANGELOG.md for `/changelog` and its RSS feed. Only the Markdown the changelog uses is
 * understood (Keep a Changelog: release headings, section headings, paragraphs, bullets, bold,
 * inline code and links); anything else stays plain text.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "heading"; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; items: Inline[][] };

export interface Release {
  /** "1.1.0", or "Unreleased". */
  version: string;
  /** `YYYY-MM-DD`; `null` until released. */
  date: string | null;
  /** Its link at the bottom of the file: the compare view or the release on GitHub. */
  url: string | null;
  /** The fragment it is linked with: `v1.1.0`, `unreleased`. */
  anchor: string;
  blocks: Block[];
}

export interface Changelog {
  /** What comes before the first release. */
  intro: Block[];
  /** Newest first, as the file lists them. */
  releases: Release[];
}

type References = Map<string, string>;

/** `[1.1.0]: https://…` */
const REFERENCE = /^\[([^\]]+)\]:\s*(\S+)\s*$/;
/** `## [1.1.0] - 2026-09-29`, `## [Unreleased]` */
const RELEASE = /^##\s+\[?([^\]\s]+)\]?(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/;
const BULLET = /^[-*]\s+/;

export function parseChangelog(markdown: string): Changelog {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const references: References = new Map();
  for (const line of lines) {
    const match = REFERENCE.exec(line);
    if (match) references.set(match[1].toLowerCase(), match[2]);
  }

  const intro: Block[] = [];
  const releases: Release[] = [];
  let blocks = intro;
  // The paragraph or list item being read, whose lines are joined until a blank line.
  let text: string[] | null = null;
  let item = false;

  const flush = () => {
    if (text === null) return;
    const children = parseInline(text.join(" "), references);
    const last = blocks.at(-1);
    if (!item) blocks.push({ type: "paragraph", children });
    else if (last?.type === "list") last.items.push(children);
    else blocks.push({ type: "list", items: [children] });
    text = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const release = RELEASE.exec(trimmed);
    if (REFERENCE.test(trimmed) || /^#\s/.test(trimmed)) {
      flush();
    } else if (release) {
      flush();
      const [, version, date = null] = release;
      blocks = [];
      releases.push({
        version,
        date,
        url: safeHref(references.get(version.toLowerCase()) ?? "") ?? null,
        anchor: date === null ? version.toLowerCase() : `v${version}`,
        blocks,
      });
    } else if (/^#{2,6}\s/.test(trimmed)) {
      flush();
      blocks.push({
        type: "heading",
        children: parseInline(trimmed.replace(/^#+\s+/, ""), references),
      });
    } else if (BULLET.test(trimmed)) {
      flush();
      text = [trimmed.replace(BULLET, "")];
      item = true;
    } else if (trimmed === "") {
      flush();
    } else if (text !== null && (item ? /^\s/.test(line) : true)) {
      text.push(trimmed);
    } else {
      flush();
      text = [trimmed];
      item = false;
    }
  }
  flush();
  return { intro, releases };
}

/** Links go to the web or within the site: never `javascript:` and the like. */
function safeHref(href: string): string | null {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(href) ? href : null;
}

/** `**bold**`, `` `code` ``, `[text](url)` and `[text]` or `[text][ref]` with a reference. */
const INLINE = /`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\](?:\(([^)\s]+)\)|\[([^\]]*)\])?/g;

export function parseInline(source: string, references: References = new Map()): Inline[] {
  const nodes: Inline[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = nodes.at(-1);
    if (last?.type === "text") last.text += text;
    else nodes.push({ type: "text", text });
  };

  let cursor = 0;
  for (const match of source.matchAll(INLINE)) {
    const [whole, code, strong, label, href, reference] = match;
    pushText(source.slice(cursor, match.index));
    cursor = match.index + whole.length;
    if (code !== undefined) {
      nodes.push({ type: "code", text: code });
    } else if (strong !== undefined) {
      nodes.push({ type: "strong", children: parseInline(strong, references) });
    } else {
      const target = safeHref(href ?? references.get((reference || label).toLowerCase()) ?? "");
      if (target === null) pushText(whole);
      else nodes.push({ type: "link", href: target, children: parseInline(label, references) });
    }
  }
  pushText(source.slice(cursor));
  return nodes;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineHtml(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return escapeHtml(node.text);
        case "code":
          return `<code>${escapeHtml(node.text)}</code>`;
        case "strong":
          return `<strong>${inlineHtml(node.children)}</strong>`;
        case "link":
          return `<a href="${escapeHtml(node.href)}">${inlineHtml(node.children)}</a>`;
      }
    })
    .join("");
}

/** HTML for readers that cannot run the page, such as feed readers. */
export function blocksHtml(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h3>${inlineHtml(block.children)}</h3>`;
        case "paragraph":
          return `<p>${inlineHtml(block.children)}</p>`;
        case "list":
          return `<ul>${block.items.map((item) => `<li>${inlineHtml(item)}</li>`).join("")}</ul>`;
      }
    })
    .join("\n");
}

/** Released versions only: the unreleased section has no date to publish it at. */
export function releasedVersions(changelog: Changelog): Release[] {
  return changelog.releases.filter((release) => release.date !== null);
}

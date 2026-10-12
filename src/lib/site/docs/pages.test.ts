import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";
import {
  DOCS_PAGES,
  DOCS_PATHS,
  docsNeighbors,
  docsPath,
  githubDocPath,
  GITHUB_DOCS,
  isDocsSlug,
} from "./pages";

describe("docsPath", () => {
  it("puts the docs' home at /docs and each guide under it", () => {
    expect(docsPath("overview")).toBe("/docs");
    expect(docsPath("get-started")).toBe("/docs/get-started");
    expect(DOCS_PATHS).toHaveLength(DOCS_PAGES.length);
    expect(DOCS_PATHS[0]).toBe("/docs");
  });
});

describe("isDocsSlug", () => {
  it("knows the guides, and nothing else", () => {
    expect(isDocsSlug("self-hosting")).toBe(true);
    expect(isDocsSlug("overview")).toBe(false);
    expect(isDocsSlug("pricing")).toBe(false);
  });
});

describe("docsNeighbors", () => {
  it("follows the reading order, from the docs' home to the last guide", () => {
    expect(docsNeighbors("overview")).toEqual({ previous: null, next: "get-started" });
    expect(docsNeighbors("get-started")).toEqual({ previous: "overview", next: "wall-display" });
    expect(docsNeighbors("self-hosting")).toEqual({ previous: "security", next: null });
  });
});

describe("githubDocPath", () => {
  it("prints a guide's file and section as the repository names them", () => {
    expect(githubDocPath(GITHUB_DOCS.stripeUpdates)).toEqual({
      file: "docs/stripe.md",
      anchor: "#instant-updates",
    });
    expect(githubDocPath(GITHUB_DOCS.selfHosting)).toEqual({
      file: "docs/self-hosting.md",
      anchor: null,
    });
    expect(githubDocPath(GITHUB_DOCS.docs)).toEqual({ file: "docs", anchor: null });
  });
});

/** The anchor GitHub gives a Markdown heading: lowercase, punctuation dropped, spaces as hyphens. */
function githubAnchor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

describe("GITHUB_DOCS", () => {
  const blob = `${siteConfig.repositoryUrl}/blob/main/`;

  it.each(Object.entries(GITHUB_DOCS))("%s points to a file and a heading that exist", (_, url) => {
    if (!url.startsWith(blob)) return;
    const [file, anchor] = url.slice(blob.length).split("#");
    const markdown = readFileSync(path.join(process.cwd(), file), "utf8");
    if (anchor === undefined) return;
    const anchors = [...markdown.matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) =>
      githubAnchor(heading),
    );
    expect(anchors).toContain(anchor);
  });
});

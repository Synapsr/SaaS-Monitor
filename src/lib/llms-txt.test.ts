import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";
import { llmsTxt } from "./llms-txt";

describe("llmsTxt", () => {
  const text = llmsTxt("https://saas-monitor.com");

  it("follows the llms.txt layout: a title, then a summary", () => {
    const [title, , summary] = text.split("\n");
    expect(title).toBe(`# ${siteConfig.name}`);
    expect(summary).toMatch(/^> /);
  });

  it("links the demo, the docs and the code with absolute URLs", () => {
    expect(text).toContain("(https://saas-monitor.com/d/demo)");
    expect(text).toContain(`(${siteConfig.stripeDocsUrl})`);
    expect(text).toContain(`(${siteConfig.wallDisplayDocsUrl})`);
    expect(text).toContain(`(${siteConfig.selfHostingUrl})`);
    expect(text).toContain(`(${siteConfig.repositoryUrl})`);
    expect(text).not.toMatch(/\]\(\//);
  });
});

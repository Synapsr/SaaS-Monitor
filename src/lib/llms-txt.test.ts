import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";
import { llmsFullTxt, llmsTxt } from "./llms-txt";

describe("llmsTxt", () => {
  const text = llmsTxt("https://saas-monitor.com");

  it("follows the llms.txt layout: a title, then a summary", () => {
    const [title, , summary] = text.split("\n");
    expect(title).toBe(`# ${siteConfig.name}`);
    expect(summary).toMatch(/^> /);
  });

  it("links the demo, the docs, the code and every language with absolute URLs", () => {
    expect(text).toContain("(https://saas-monitor.com/d/demo)");
    expect(text).toContain(`(${siteConfig.stripeDocsUrl})`);
    expect(text).toContain(`(${siteConfig.wallDisplayDocsUrl})`);
    expect(text).toContain(`(${siteConfig.selfHostingUrl})`);
    expect(text).toContain(`(${siteConfig.repositoryUrl})`);
    expect(text).toContain("(https://saas-monitor.com/fr)");
    expect(text).toContain("(https://saas-monitor.com/llms-full.txt)");
    expect(text).toContain("(https://saas-monitor.com/docs)");
    expect(text).toContain("(https://saas-monitor.com/docs/get-started)");
    expect(text).toContain("(https://saas-monitor.com/docs/self-hosting)");
    expect(text).not.toMatch(/\]\(\//);
  });

  it("credits its maker", () => {
    expect(text).toContain("Made by [Synapsr](https://synapsr.io)");
  });
});

describe("llmsFullTxt", () => {
  it("follows the summary with each doc", () => {
    const text = llmsFullTxt("https://saas-monitor.com", [
      { title: "docs/stripe.md", markdown: "# Connect Stripe\n\nPaste the key.\n" },
    ]);
    expect(text.startsWith(`# ${siteConfig.name}`)).toBe(true);
    expect(text).toContain("<!-- docs/stripe.md -->\n\n# Connect Stripe\n\nPaste the key.\n");
  });
});

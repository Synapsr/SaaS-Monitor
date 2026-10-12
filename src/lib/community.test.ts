import { describe, expect, it } from "vitest";
import { communityLinks, shareIntentUrl, WALL_SHARE_TEXT } from "./community";

describe("shareIntentUrl", () => {
  it("pre-fills X's web intent with the text and the hosted homepage apart", () => {
    const url = new URL(shareIntentUrl("x"));
    expect(url.origin + url.pathname).toBe("https://x.com/intent/tweet");
    expect(url.searchParams.get("text")).toBe(WALL_SHARE_TEXT);
    expect(url.searchParams.get("url")).toBe("https://saas-monitor.com");
  });

  it("puts the link at the end of LinkedIn's text, the only field its composer takes", () => {
    const url = new URL(shareIntentUrl("linkedin"));
    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/feed/");
    expect(url.searchParams.get("shareActive")).toBe("true");
    expect(url.searchParams.get("text")).toBe(`${WALL_SHARE_TEXT} https://saas-monitor.com`);
  });

  it("encodes spaces, emoji and reserved characters so the text arrives intact", () => {
    const text = "Rent & coffee: 100% covered 🔔 #buildinpublic?";
    const url = shareIntentUrl("x", text);
    expect(url).not.toMatch(/[ #🔔]/u);
    expect(url).toContain("%F0%9F%94%94");
    expect(new URL(url).searchParams.get("text")).toBe(text);
  });

  it("keeps the X post well under its 280 characters", () => {
    // X counts every link as 23 characters, whatever its length.
    expect(WALL_SHARE_TEXT.length + 1 + 23).toBeLessThan(280);
  });
});

describe("communityLinks", () => {
  it("points at the repository's pages", () => {
    expect(communityLinks.star).toBe("https://github.com/Synapsr/SaaS-Monitor");
    expect(communityLinks.feedback).toBe(
      "https://github.com/Synapsr/SaaS-Monitor/issues/new/choose",
    );
    expect(communityLinks.showYourWall).toBe(
      "https://github.com/Synapsr/SaaS-Monitor/discussions/new?category=show-and-tell",
    );
    expect(communityLinks.changelog).toBe("/changelog");
  });

  it("opens the docs of the instance itself", () => {
    expect(communityLinks.docs).toBe("/docs");
  });
});

import { describe, expect, it } from "vitest";
import { siteRoute } from "./routing";

describe("siteRoute", () => {
  it("serves English pages from their unprefixed address", () => {
    expect(siteRoute("/")).toEqual({ kind: "page", rewrite: "/en" });
    expect(siteRoute("/stripe-notification-sound")).toEqual({
      kind: "page",
      rewrite: "/en/stripe-notification-sound",
    });
    expect(siteRoute("/privacy")).toEqual({ kind: "page", rewrite: "/en/privacy" });
    expect(siteRoute("/alternatives/geckoboard")).toEqual({
      kind: "page",
      rewrite: "/en/alternatives/geckoboard",
    });
    expect(siteRoute("/docs")).toEqual({ kind: "page", rewrite: "/en/docs" });
    expect(siteRoute("/docs/get-started")).toEqual({
      kind: "page",
      rewrite: "/en/docs/get-started",
    });
  });

  it("answers unknown addresses from the site, for its 404 page", () => {
    expect(siteRoute("/pricing")).toEqual({ kind: "page", rewrite: "/en/pricing" });
  });

  it("serves other languages under their prefix", () => {
    expect(siteRoute("/fr")).toEqual({ kind: "page", rewrite: null });
    expect(siteRoute("/pt/stripe-notification-sound")).toEqual({ kind: "page", rewrite: null });
    expect(siteRoute("/fr/docs/self-hosting")).toEqual({ kind: "page", rewrite: null });
  });

  it("redirects English addresses with a prefix to those without", () => {
    expect(siteRoute("/en")).toEqual({ kind: "redirect", pathname: "/" });
    expect(siteRoute("/en/")).toEqual({ kind: "redirect", pathname: "/" });
    expect(siteRoute("/en/stripe-notification-sound")).toEqual({
      kind: "redirect",
      pathname: "/stripe-notification-sound",
    });
    expect(siteRoute("/en/docs/numbers")).toEqual({ kind: "redirect", pathname: "/docs/numbers" });
  });

  it("leaves the product, the API and the build alone", () => {
    for (const path of [
      "/app",
      "/app/screens/1",
      "/sign-in",
      "/sign-up",
      "/invite/abc",
      "/d/demo",
      "/d/0123456789abcdef",
      "/api/health",
      "/_next/static/chunks/main.js",
      "/sounds/register/payment.wav",
      "/voices/marius/goal.mp3",
      "/.well-known/apple-app-site-association",
    ]) {
      expect(siteRoute(path), path).toEqual({ kind: "other" });
    }
  });

  it("leaves files and metadata routes alone, in any language", () => {
    for (const path of [
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/install.sh",
      "/icon.svg",
      "/apple-icon",
      "/opengraph-image",
      "/en/opengraph-image",
      "/fr/opengraph-image",
      "/changelog/rss.xml",
      "/images/screen.webp",
      "/images/docs/editor.webp",
    ]) {
      expect(siteRoute(path), path).toEqual({ kind: "other" });
    }
  });

  it("doesn't take words that start like a language for one", () => {
    expect(siteRoute("/english")).toEqual({ kind: "page", rewrite: "/en/english" });
    expect(siteRoute("/frank")).toEqual({ kind: "page", rewrite: "/en/frank" });
  });
});

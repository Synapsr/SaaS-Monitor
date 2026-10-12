import type { ResolvedMetadata, ResolvingMetadata } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sitePageMetadata, siteUrl } from "./page-metadata";

const image = { url: "https://saas-monitor.example/opengraph-image?1a2b3c" };

function parentWith(openGraph: unknown): ResolvingMetadata {
  return Promise.resolve({ openGraph } as ResolvedMetadata);
}

describe("sitePageMetadata", () => {
  it("sets the title, description, canonical URL and social preview of an English page", async () => {
    const metadata = await sitePageMetadata(
      {
        title: "Changelog",
        description: "What changed.",
        path: "/changelog",
        types: { "application/rss+xml": "/changelog/rss.xml" },
      },
      parentWith({ images: [image] }),
    );
    expect(metadata).toEqual({
      title: "Changelog",
      description: "What changed.",
      alternates: {
        canonical: "https://saas-monitor.com/changelog",
        types: { "application/rss+xml": "/changelog/rss.xml" },
      },
      openGraph: {
        type: "website",
        siteName: "SaaS Monitor",
        title: "Changelog",
        description: "What changed.",
        url: "https://saas-monitor.com/changelog",
        locale: "en_US",
        images: [image],
      },
    });
  });

  it("links a translated page to its other languages", async () => {
    const metadata = await sitePageMetadata(
      {
        title: "Son des notifications Stripe",
        description: "Comment le changer.",
        path: "/stripe-notification-sound",
        language: "fr",
      },
      parentWith(null),
    );
    expect(metadata.alternates?.canonical).toBe(
      "https://saas-monitor.com/fr/stripe-notification-sound",
    );
    expect(metadata.alternates?.languages).toMatchObject({
      en: "https://saas-monitor.com/stripe-notification-sound",
      "pt-BR": "https://saas-monitor.com/pt/stripe-notification-sound",
      "x-default": "https://saas-monitor.com/stripe-notification-sound",
    });
    expect(metadata.openGraph).toMatchObject({
      locale: "fr_FR",
      url: "https://saas-monitor.com/fr/stripe-notification-sound",
    });
    expect(metadata.openGraph?.alternateLocale).toHaveLength(6);
    expect(metadata.openGraph?.alternateLocale).not.toContain("fr_FR");
  });

  it("keeps the home page's title whole", async () => {
    const metadata = await sitePageMetadata(
      { title: "SaaS Monitor · Home", absoluteTitle: true, description: "…", path: "/" },
      parentWith(null),
    );
    expect(metadata.title).toEqual({ absolute: "SaaS Monitor · Home" });
    expect(metadata.alternates?.canonical).toBe("https://saas-monitor.com/");
    expect(metadata.openGraph).not.toHaveProperty("images");
  });
});

describe("siteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is APP_URL, or localhost when it is empty", () => {
    vi.stubEnv("APP_URL", "https://saas-monitor.example");
    expect(siteUrl().href).toBe("https://saas-monitor.example/");
    vi.stubEnv("APP_URL", "");
    expect(siteUrl().href).toBe("http://localhost:3000/");
  });
});

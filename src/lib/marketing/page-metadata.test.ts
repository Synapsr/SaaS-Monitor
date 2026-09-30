import type { ResolvedMetadata, ResolvingMetadata } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { contentMetadata, siteUrl } from "./page-metadata";

const image = { url: "https://saas-monitor.example/opengraph-image?1a2b3c" };

function parentWith(openGraph: unknown): ResolvingMetadata {
  return Promise.resolve({ openGraph } as ResolvedMetadata);
}

describe("contentMetadata", () => {
  it("sets the title, description, canonical URL and social preview of the page", async () => {
    const metadata = await contentMetadata(
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
        canonical: "/changelog",
        types: { "application/rss+xml": "/changelog/rss.xml" },
      },
      openGraph: {
        type: "website",
        siteName: "SaaS Monitor",
        title: "Changelog",
        description: "What changed.",
        url: "/changelog",
        images: [image],
      },
    });
  });

  it("does without a parent image", async () => {
    const metadata = await contentMetadata(
      { title: "Alternatives", description: "Compared.", path: "/alternatives" },
      parentWith(null),
    );
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.alternates).toEqual({ canonical: "/alternatives" });
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

import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";
import { serializeJsonLd, softwareApplicationJsonLd } from "./structured-data";

describe("softwareApplicationJsonLd", () => {
  const data = softwareApplicationJsonLd("https://saas-monitor.com");

  it("describes a free, open-source business application", () => {
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      url: "https://saas-monitor.com/",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Docker, Raspberry Pi",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: siteConfig.licenseUrl,
      sameAs: [siteConfig.repositoryUrl],
      author: { "@type": "Organization", name: "Lumy.Media SAS" },
    });
  });

  it("links pages of this app with absolute URLs", () => {
    expect(data.releaseNotes).toBe("https://saas-monitor.com/changelog");
  });
});

describe("serializeJsonLd", () => {
  it("never lets a string close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

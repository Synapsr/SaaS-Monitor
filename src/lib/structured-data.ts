import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * The landing page described for search engines and AI assistants (schema.org, as JSON-LD).
 * `codeRepository` belongs to source code, not applications: the repository is its `sameAs`.
 */
export function softwareApplicationJsonLd(appUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl(appUrl, "/"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Docker, Raspberry Pi",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
    license: siteConfig.licenseUrl,
    sameAs: [siteConfig.repositoryUrl],
    releaseNotes: absoluteUrl(appUrl, "/changelog"),
    softwareHelp: { "@type": "CreativeWork", url: siteConfig.docsUrl },
    author: { "@type": "Organization", name: siteConfig.maker.name, url: siteConfig.maker.url },
  };
}

/**
 * JSON for a `<script type="application/ld+json">`: `<` is escaped, so that no string in it can
 * close the script tag (Next.js's JSON-LD guide).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

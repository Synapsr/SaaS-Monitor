const repositoryUrl = "https://github.com/Synapsr/SaaS-Monitor";

export const siteConfig = {
  name: "SaaS Monitor",
  tagline: "Your MRR, live on the wall.",
  /** What the product is, in the words people search with: the landing page's title. */
  headline: "Open-source Stripe dashboard for your office TV",
  /** For search results and social previews: keep it under 160 characters. */
  description:
    "Your Stripe MRR, live on the office TV or a Raspberry Pi, with a sound for every sale. Open source: hosted for you, or self-hosted for free.",
  repositoryUrl,
  licenseUrl: `${repositoryUrl}/blob/main/LICENSE`,
  docsUrl: `${repositoryUrl}/tree/main/docs`,
  selfHostingUrl: `${repositoryUrl}/blob/main/docs/self-hosting.md`,
  stripeDocsUrl: `${repositoryUrl}/blob/main/docs/stripe.md`,
  wallDisplayDocsUrl: `${repositoryUrl}/blob/main/docs/wall-display.md`,
  maker: { name: "Synapsr", url: "https://synapsr.io" },
} as const;

/** `path` (starting with `/`) on this app, as an absolute URL. `appUrl` has no trailing slash. */
export function absoluteUrl(appUrl: string, path: `/${string}`): string {
  return `${appUrl}${path}`;
}

const repositoryUrl = "https://github.com/Synapsr/SaaS-Monitor";
const hostedUrl = "https://saas-monitor.com";

export const siteConfig = {
  name: "SaaS Monitor",
  tagline: "Your MRR, live on the wall.",
  /** What the product is, in the words people search with: the landing page's title. */
  headline: "Open-source Stripe dashboard for your office TV",
  /** For search results and social previews: keep it under 160 characters. */
  description:
    "Your Stripe MRR, live on the office TV or a Raspberry Pi, with a sound for every sale. Open source: hosted for you, or self-hosted for free.",
  repositoryUrl,
  /** The instance run by the project, free during the public beta. */
  hostedUrl,
  licenseUrl: `${repositoryUrl}/blob/main/LICENSE`,
  docsUrl: `${repositoryUrl}/tree/main/docs`,
  selfHostingUrl: `${repositoryUrl}/blob/main/docs/self-hosting.md`,
  stripeDocsUrl: `${repositoryUrl}/blob/main/docs/stripe.md`,
  wallDisplayDocsUrl: `${repositoryUrl}/blob/main/docs/wall-display.md`,
  /**
   * Who makes it, as the site credits it. The legal publisher of the hosted service is another
   * matter: `publisher` (`src/lib/legal.ts`), on the legal pages.
   */
  maker: {
    name: "Synapsr",
    url: "https://synapsr.io",
    githubUrl: "https://github.com/Synapsr",
    /** Who builds it there. */
    builder: "Loan Talvat",
  },
} as const;

export interface StoreApp {
  /** Its page in the store. */
  url: string;
  /**
   * Whether the store lists it. Until then, the site says it is coming without linking to it;
   * once it does, the site links to it and describes it in its structured data.
   */
  live: boolean;
}

/** The SaaS Monitor app (iPhone, iPad, Apple Watch; Android, Wear OS), in its two stores. */
export const apps: { appStore: StoreApp; googlePlay: StoreApp } = {
  appStore: { url: "https://apps.apple.com/app/id6820038376", live: false },
  googlePlay: {
    url: "https://play.google.com/store/apps/details?id=com.saasmonitor.app",
    live: false,
  },
};

/** Whether an instance at `appUrl` is the project's own, rather than a self-hosted one. */
export function isHostedInstance(appUrl: string): boolean {
  return new URL(appUrl).host === new URL(hostedUrl).host;
}

/** `path` (starting with `/`) on this app, as an absolute URL. `appUrl` has no trailing slash. */
export function absoluteUrl(appUrl: string, path: `/${string}`): string {
  return `${appUrl}${path}`;
}

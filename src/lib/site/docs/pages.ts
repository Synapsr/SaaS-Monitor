import { siteConfig } from "@/lib/site";
import type { DocsText } from "./en";

/**
 * The docs of the site (`/docs`): short pages a founder reads in a minute or two, each pointing
 * to the detailed section of the guides on GitHub (`docs/*.md`). Listed in reading order: the
 * sidebar, the previous and next links, the sitemap and `llms.txt` follow it.
 */
export const DOCS_SLUGS = [
  "get-started",
  "wall-display",
  "customize",
  "apps",
  "numbers",
  "security",
  "self-hosting",
] as const;

export type DocsSlug = (typeof DOCS_SLUGS)[number];

/** A page of the docs: their home (`overview`, at `/docs`) or one of the guides. */
export type DocsPage = "overview" | DocsSlug;

export type DocsPath = "/docs" | `/docs/${DocsSlug}`;

export function isDocsSlug(value: string): value is DocsSlug {
  return DOCS_SLUGS.some((slug) => slug === value);
}

/** The page's address in English: `/docs` or `/docs/get-started`. */
export function docsPath(page: DocsPage): DocsPath {
  return page === "overview" ? "/docs" : `/docs/${page}`;
}

/** Where each page finds its words in `DocsText`. */
export const DOCS_TEXT_KEYS = {
  overview: "overview",
  "get-started": "getStarted",
  "wall-display": "wallDisplay",
  customize: "customize",
  apps: "apps",
  numbers: "numbers",
  security: "security",
  "self-hosting": "selfHosting",
} as const satisfies Record<DocsPage, keyof DocsText>;

/** Every page of the docs, their home first. */
export const DOCS_PAGES: readonly DocsPage[] = ["overview", ...DOCS_SLUGS];

export const DOCS_PATHS: readonly DocsPath[] = DOCS_PAGES.map(docsPath);

/** The pages before and after `page`, in reading order. */
export function docsNeighbors(page: DocsPage): {
  previous: DocsPage | null;
  next: DocsPage | null;
} {
  const index = DOCS_PAGES.indexOf(page);
  return {
    previous: index > 0 ? DOCS_PAGES[index - 1] : null,
    next: index < DOCS_PAGES.length - 1 ? DOCS_PAGES[index + 1] : null,
  };
}

const { repositoryUrl, stripeDocsUrl, wallDisplayDocsUrl, selfHostingUrl } = siteConfig;

/**
 * The sections of the guides on GitHub that the pages send readers to for the details, by the
 * anchors GitHub gives their headings. Keep them in step with `docs/*.md`.
 */
export const GITHUB_DOCS = {
  docs: siteConfig.docsUrl,
  stripe: stripeDocsUrl,
  stripeKey: `${stripeDocsUrl}#create-the-key`,
  stripeImport: `${stripeDocsUrl}#first-import`,
  stripeMrr: `${stripeDocsUrl}#how-mrr-is-computed`,
  stripeConnect: `${stripeDocsUrl}#stripe-connect-platforms`,
  stripeUpdates: `${stripeDocsUrl}#instant-updates`,
  stripeSecurity: `${stripeDocsUrl}#security`,
  wall: wallDisplayDocsUrl,
  wallMoments: `${wallDisplayDocsUrl}#moments`,
  wallEvents: `${wallDisplayDocsUrl}#events`,
  wallSound: `${wallDisplayDocsUrl}#sound`,
  wallVoice: `${wallDisplayDocsUrl}#voice`,
  wallPhone: `${wallDisplayDocsUrl}#on-your-phone`,
  wallRaspberryPi: `${wallDisplayDocsUrl}#raspberry-pi-recommended`,
  wallDevices: `${wallDisplayDocsUrl}#other-devices`,
  wallAccounts: `${wallDisplayDocsUrl}#several-products-on-one-screen`,
  wallLook: `${wallDisplayDocsUrl}#look-and-language`,
  selfHosting: selfHostingUrl,
  selfHostingInstall: `${selfHostingUrl}#quick-start-with-docker`,
  selfHostingConfiguration: `${selfHostingUrl}#configuration`,
  selfHostingNotifications: `${selfHostingUrl}#notifications`,
  selfHostingHttps: `${selfHostingUrl}#public-url-and-https`,
  selfHostingUpdates: `${selfHostingUrl}#updating`,
  selfHostingBackups: `${selfHostingUrl}#backups`,
  security: `${repositoryUrl}/blob/main/SECURITY.md`,
  installScript: `${repositoryUrl}/blob/main/public/install.sh`,
} as const;

export type GitHubDoc = keyof typeof GITHUB_DOCS;

/**
 * Where a guide sends readers on GitHub, as the docs print it: the file (`docs/stripe.md`) and
 * the section (`#instant-updates`), or `null` for the whole file.
 */
export function githubDocPath(url: string): { file: string; anchor: string | null } {
  const { pathname, hash } = new URL(url);
  const file = pathname.replace(/^\/[^/]+\/[^/]+\/(?:blob|tree)\/[^/]+\//, "");
  return { file, anchor: hash || null };
}

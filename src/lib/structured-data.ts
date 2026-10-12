import { apps, siteConfig } from "@/lib/site";
import { LANGUAGE_TAGS, SITE_LANGUAGES, type SiteLanguage } from "@/lib/site/languages";
import { canonicalUrl } from "@/lib/site/paths";
import { plainText } from "@/lib/site/rich-text";

/**
 * The site described for search engines and AI assistants (schema.org, as JSON-LD). Every
 * address is on saas-monitor.com, like canonical links: self-hosted copies describe the original.
 * It credits the product to its maker, Synapsr (`siteConfig.maker`); the legal publisher of the
 * hosted service stays on the legal pages (`src/lib/legal.ts`).
 */

const HOME = canonicalUrl("en", "/");
const ORGANIZATION_ID = `${HOME}#organization`;
const SOFTWARE_ID = `${HOME}#software`;

export interface Question {
  question: string;
  /** Paragraphs, with the site's link markup. */
  answer: readonly string[];
}

function organization() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.maker.name,
    url: siteConfig.maker.url,
    sameAs: [siteConfig.maker.githubUrl],
  };
}

function softwareApplication(language: SiteLanguage, description: string) {
  return {
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: siteConfig.name,
    description,
    url: canonicalUrl(language, "/"),
    image: `${siteConfig.hostedUrl}/images/demo/en.webp`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Docker, Raspberry Pi",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
    inLanguage: SITE_LANGUAGES.map((other) => LANGUAGE_TAGS[other]),
    license: siteConfig.licenseUrl,
    sameAs: [siteConfig.repositoryUrl],
    releaseNotes: canonicalUrl("en", "/changelog"),
    softwareHelp: { "@type": "CreativeWork", url: canonicalUrl(language, "/docs") },
    author: { "@id": ORGANIZATION_ID },
    creator: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** The code behind it: what makes it open source, for the assistants asked for one. */
function sourceCode() {
  return {
    "@type": "SoftwareSourceCode",
    name: siteConfig.name,
    codeRepository: siteConfig.repositoryUrl,
    license: siteConfig.licenseUrl,
    programmingLanguage: "TypeScript",
    runtimePlatform: "Node.js",
    targetProduct: { "@id": SOFTWARE_ID },
    author: { "@id": ORGANIZATION_ID },
  };
}

/** The app in each store that lists it: none until they do (`apps`). */
function mobileApplications(description: string) {
  const stores = [
    { app: apps.appStore, operatingSystem: "iOS, iPadOS, watchOS" },
    { app: apps.googlePlay, operatingSystem: "Android, Wear OS" },
  ];
  return stores
    .filter(({ app }) => app.live)
    .map(({ app, operatingSystem }) => ({
      "@type": "MobileApplication",
      name: siteConfig.name,
      description,
      operatingSystem,
      applicationCategory: "BusinessApplication",
      installUrl: app.url,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": ORGANIZATION_ID },
    }));
}

/** Questions answered on the page, as visitors read them. */
export function faqPage(language: SiteLanguage, path: `/${string}`, items: readonly Question[]) {
  return {
    "@type": "FAQPage",
    "@id": `${canonicalUrl(language, path)}#faq`,
    inLanguage: LANGUAGE_TAGS[language],
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer.map(plainText).join("\n\n") },
    })),
  };
}

/** The home page: who publishes what, the site, the application, its code and the FAQ. */
export function homeJsonLd({
  language,
  description,
  appDescription,
  questions,
}: {
  language: SiteLanguage;
  description: string;
  /** What the mobile app does, in the page's language. */
  appDescription: string;
  questions: readonly Question[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization(),
      {
        "@type": "WebSite",
        "@id": `${HOME}#website`,
        url: HOME,
        name: siteConfig.name,
        inLanguage: SITE_LANGUAGES.map((other) => LANGUAGE_TAGS[other]),
        publisher: { "@id": ORGANIZATION_ID },
      },
      softwareApplication(language, description),
      sourceCode(),
      ...mobileApplications(appDescription),
      faqPage(language, "/", questions),
    ],
  };
}

/** Who publishes the site, for the graphs of the pages beside the home page. */
export function publisher() {
  return organization();
}

/**
 * A page of the docs: an article about the application, in the page's language, published by its
 * maker. `image` is a picture of what it explains, on the site.
 */
export function techArticle({
  language,
  path,
  title,
  description,
  image,
}: {
  language: SiteLanguage;
  path: `/${string}`;
  title: string;
  description: string;
  /** On the site: `/images/demo/en.webp`. */
  image?: string;
}) {
  const url = canonicalUrl(language, path);
  return {
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: LANGUAGE_TAGS[language],
    ...(image && { image: `${siteConfig.hostedUrl}${image}` }),
    isPartOf: { "@type": "WebSite", "@id": `${HOME}#website`, name: siteConfig.name, url: HOME },
    about: { "@type": "SoftwareApplication", "@id": SOFTWARE_ID, name: siteConfig.name },
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Where a page sits on the site, from the home page down, each step in the page's language. */
export function breadcrumbList(
  language: SiteLanguage,
  steps: readonly { name: string; path: `/${string}` }[],
) {
  const last = steps.at(-1);
  return {
    "@type": "BreadcrumbList",
    ...(last && { "@id": `${canonicalUrl(language, last.path)}#breadcrumb` }),
    itemListElement: steps.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: canonicalUrl(language, path),
    })),
  };
}

/**
 * Steps to follow, as a page lays them out: each one has an anchor on the page (`#step-1`).
 * `totalTime` is an ISO 8601 duration, such as `PT2M`.
 */
export function howTo({
  language,
  path,
  name,
  description,
  totalTime,
  steps,
}: {
  language: SiteLanguage;
  path: `/${string}`;
  name: string;
  description: string;
  totalTime?: string;
  /** Texts with the site's markup, which structured data leaves out. */
  steps: readonly { name: string; text: string; anchor: string }[];
}) {
  const url = canonicalUrl(language, path);
  return {
    "@type": "HowTo",
    "@id": `${url}#how-to`,
    name,
    description,
    inLanguage: LANGUAGE_TAGS[language],
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: plainText(step.text),
      url: `${url}#${step.anchor}`,
    })),
  };
}

/** A page's own graph, for the pages beside the home page. */
export function pageJsonLd(nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * JSON for a `<script type="application/ld+json">`: `<` is escaped, so that no string in it can
 * close the script tag (Next.js's JSON-LD guide).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

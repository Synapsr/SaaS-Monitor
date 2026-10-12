import { publisher } from "@/lib/legal";
import { apps, siteConfig } from "@/lib/site";
import { LANGUAGE_TAGS, SITE_LANGUAGES, type SiteLanguage } from "@/lib/site/languages";
import { canonicalUrl } from "@/lib/site/paths";
import { plainText } from "@/lib/site/rich-text";

/**
 * The site described for search engines and AI assistants (schema.org, as JSON-LD). Every
 * address is on saas-monitor.com, like canonical links: self-hosted copies describe the original.
 * The publisher is the company behind the hosted service (`src/lib/legal.ts`); the repository's
 * GitHub organization is not a legal entity.
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
    name: publisher.name,
    email: publisher.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: publisher.address.street,
      postalCode: publisher.address.postalCode,
      addressLocality: publisher.address.city,
      addressCountry: "FR",
    },
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
    softwareHelp: { "@type": "CreativeWork", url: siteConfig.docsUrl },
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

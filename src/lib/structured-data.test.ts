import { afterEach, describe, expect, it } from "vitest";
import { apps, siteConfig } from "@/lib/site";
import {
  breadcrumbList,
  faqPage,
  homeJsonLd,
  howTo,
  serializeJsonLd,
  techArticle,
} from "./structured-data";

function graphOf(data: ReturnType<typeof homeJsonLd>) {
  return data["@graph"] as Record<string, unknown>[];
}

function nodeOf(data: ReturnType<typeof homeJsonLd>, type: string) {
  return graphOf(data).find((node) => node["@type"] === type);
}

const home = (language: "en" | "fr" = "en") =>
  homeJsonLd({
    language,
    description: "Your MRR on the wall.",
    appDescription: "The app.",
    questions: [{ question: "Safe?", answer: ["Yes. [See every permission](permissions)"] }],
  });

describe("homeJsonLd", () => {
  it("describes a free, open-source business application made by Synapsr, and its support", () => {
    const data = home();
    expect(data["@context"]).toBe("https://schema.org");
    expect(nodeOf(data, "SoftwareApplication")).toMatchObject({
      name: siteConfig.name,
      url: "https://saas-monitor.com/",
      applicationCategory: "BusinessApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: siteConfig.licenseUrl,
      sameAs: [siteConfig.repositoryUrl],
      releaseNotes: "https://saas-monitor.com/changelog",
      publisher: { "@id": "https://saas-monitor.com/#organization" },
    });
    expect(nodeOf(data, "SoftwareApplication")).toMatchObject({
      author: { "@id": "https://saas-monitor.com/#organization" },
      creator: { "@id": "https://saas-monitor.com/#organization" },
    });
    expect(nodeOf(data, "Organization")).toEqual({
      "@type": "Organization",
      "@id": "https://saas-monitor.com/#organization",
      name: "Synapsr",
      url: "https://synapsr.io",
      sameAs: ["https://github.com/Synapsr"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@saas-monitor.com",
      },
    });
  });

  it("links the open-source code to the application", () => {
    expect(nodeOf(home(), "SoftwareSourceCode")).toMatchObject({
      codeRepository: siteConfig.repositoryUrl,
      targetProduct: { "@id": "https://saas-monitor.com/#software" },
    });
  });

  it("points to the page's own language", () => {
    expect(nodeOf(home("fr"), "SoftwareApplication")).toMatchObject({
      url: "https://saas-monitor.com/fr",
    });
    expect(nodeOf(home("fr"), "FAQPage")).toMatchObject({ inLanguage: "fr" });
  });

  describe("mobile apps", () => {
    const live = { appStore: apps.appStore.live, googlePlay: apps.googlePlay.live };
    afterEach(() => {
      apps.appStore.live = live.appStore;
      apps.googlePlay.live = live.googlePlay;
    });

    it("are described only once a store lists them", () => {
      apps.appStore.live = false;
      apps.googlePlay.live = false;
      expect(nodeOf(home(), "MobileApplication")).toBeUndefined();

      apps.appStore.live = true;
      const listed = graphOf(home()).filter((node) => node["@type"] === "MobileApplication");
      expect(listed).toEqual([
        expect.objectContaining({
          installUrl: apps.appStore.url,
          operatingSystem: "iOS, iPadOS, watchOS",
        }),
      ]);
    });
  });
});

describe("faqPage", () => {
  it("answers in plain text, as visitors read the answers", () => {
    expect(
      faqPage("en", "/", [{ question: "Q?", answer: ["One.", "Two, [linked](mrr)."] }]),
    ).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Q?",
          acceptedAnswer: { "@type": "Answer", text: "One.\n\nTwo, linked." },
        },
      ],
    });
  });
});

describe("techArticle", () => {
  it("describes a page of the docs in its language, by the maker of the application", () => {
    expect(
      techArticle({
        language: "fr",
        path: "/docs/numbers",
        title: "Des chiffres fiables",
        description: "Le MRR comme Stripe le définit.",
        image: "/images/demo/fr.webp",
      }),
    ).toMatchObject({
      "@type": "TechArticle",
      headline: "Des chiffres fiables",
      url: "https://saas-monitor.com/fr/docs/numbers",
      inLanguage: "fr",
      image: "https://saas-monitor.com/images/demo/fr.webp",
      about: { "@id": "https://saas-monitor.com/#software" },
      publisher: { "@id": "https://saas-monitor.com/#organization" },
    });
  });
});

describe("breadcrumbList", () => {
  it("lists the way from the home page, with absolute addresses in the page's language", () => {
    expect(
      breadcrumbList("de", [
        { name: "SaaS Monitor", path: "/" },
        { name: "Doku", path: "/docs" },
      ]),
    ).toEqual({
      "@type": "BreadcrumbList",
      "@id": "https://saas-monitor.com/de/docs#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "SaaS Monitor",
          item: "https://saas-monitor.com/de",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Doku",
          item: "https://saas-monitor.com/de/docs",
        },
      ],
    });
  });
});

describe("howTo", () => {
  it("numbers the steps, in plain text, each linked to its anchor", () => {
    const data = howTo({
      language: "en",
      path: "/docs/get-started",
      name: "Get started",
      description: "Four steps.",
      totalTime: "PT2M",
      steps: [{ name: "Connect Stripe", text: "Click **Create key**.", anchor: "step-1" }],
    });
    expect(data).toMatchObject({ "@type": "HowTo", totalTime: "PT2M", inLanguage: "en" });
    expect(data.step).toEqual([
      {
        "@type": "HowToStep",
        position: 1,
        name: "Connect Stripe",
        text: "Click Create key.",
        url: "https://saas-monitor.com/docs/get-started#step-1",
      },
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("never lets a string close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

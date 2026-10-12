import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { appUrl } from "@/env";
import { BRAND_COLORS } from "@/lib/brand";
import { siteConfig } from "@/lib/site";
import {
  DEFAULT_LANGUAGE,
  isSiteLanguage,
  LANGUAGE_TAGS,
  SITE_LANGUAGES,
} from "@/lib/site/languages";
import { cn } from "@/lib/utils";
import "@/app/site.css";

/** Every language is built ahead; any other first segment is a page that doesn't exist. */
export const dynamicParams = false;

export function generateStaticParams() {
  return SITE_LANGUAGES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: BRAND_COLORS.screen,
  colorScheme: "dark",
};

export function generateMetadata(): Metadata {
  return {
    // Social previews need absolute URLs, written into the pages at build time: Docker builds
    // receive APP_URL as a build argument (compose.yaml).
    metadataBase: new URL(appUrl()),
    title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
    description: siteConfig.description,
    twitter: { card: "summary_large_image" },
  };
}

/**
 * The public site, in each of its languages: a document of its own, lighter than the dashboard's
 * (no theme switching, toasts or tooltips), whose `<html lang>` is the page's language.
 */
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  // Another first segment only gets here on its way to the 404 page (`[...missing]`), which pages
  // throw within this layout: so that it is rendered whole, in English, rather than thrown here.
  const language = isSiteLanguage(lang) ? lang : DEFAULT_LANGUAGE;

  return (
    <html lang={LANGUAGE_TAGS[language]} className={cn(GeistSans.variable, "antialiased")}>
      <body className="landing min-h-svh">{children}</body>
    </html>
  );
}

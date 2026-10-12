import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { appUrl } from "@/env";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import "./globals.css";

export function generateMetadata(): Metadata {
  return {
    // Social previews and canonical links need absolute URLs, written into static pages at build
    // time: Docker builds receive APP_URL as a build argument (compose.yaml).
    metadataBase: new URL(appUrl()),
    title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
    description: siteConfig.description,
    openGraph: { type: "website", siteName: siteConfig.name },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(GeistSans.variable, GeistMono.variable, "h-full antialiased")}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

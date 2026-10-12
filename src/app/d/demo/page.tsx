import type { Metadata } from "next";
import { DemoDisplay } from "@/components/display/demo-display";
import { env } from "@/env";
import { parseDemoOptions } from "@/lib/display/demo/options";
import { siteConfig } from "@/lib/site";

/**
 * Shared links show a card (`opengraph-image.tsx`, which `robots.ts` lets crawlers fetch), while
 * search engines leave the demo out: the landing page is what they should find.
 */
export const metadata: Metadata = {
  title: "Live demo",
  description: `A ${siteConfig.name} wall display with simulated data from a fictional SaaS: watch a sale land and a milestone fill the screen.`,
  robots: { index: false, follow: false },
};

/**
 * Where the demo invites visitors to sign up: this server, so that a self-hosted demo leads to its
 * own instance.
 */
const SIGN_UP_HREF = "/sign-up";

/** The time the demo's history ends at, fixed by the server so that hydration matches. */
function renderTime(): string {
  return new Date().toISOString();
}

/**
 * The display fed by a simulation, never by the database: for the landing page (a muted iframe
 * with `?preview=1`), screenshots and trying the product. Variants through the query string,
 * e.g. `?accent=violet&sound=arcade&names=1&range=12m&metric=arr`.
 */
export default async function DemoPage({ searchParams }: PageProps<"/d/demo">) {
  const { options, preview } = parseDemoOptions(await searchParams);
  return (
    <DemoDisplay
      options={options}
      startedAt={renderTime()}
      preview={preview}
      // A server open to invited people only has nothing to offer visitors.
      signUpHref={env().DISABLE_SIGNUPS ? null : SIGN_UP_HREF}
    />
  );
}

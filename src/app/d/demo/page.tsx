import type { Metadata } from "next";
import { DemoDisplay } from "@/components/display/demo-display";
import { parseDemoOptions } from "@/lib/display/demo/options";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Live demo",
  description: `A ${siteConfig.name} wall display with simulated data from a fictional SaaS.`,
  robots: { index: false, follow: false },
};

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
  return <DemoDisplay options={options} startedAt={renderTime()} preview={preview} />;
}

import { RssIcon } from "lucide-react";
import type { ResolvingMetadata } from "next";
import { ChangelogBlocks } from "@/components/content/changelog-blocks";
import { ContentPage, PageIntro } from "@/components/content/content-page";
import { SourceLink } from "@/components/content/source-link";
import type { Release } from "@/lib/marketing/changelog";
import { sitePageMetadata } from "@/lib/marketing/page-metadata";
import { siteConfig } from "@/lib/site";
import { readChangelog } from "@/server/changelog";

export function generateMetadata(_: PageProps<"/[lang]/changelog">, parent: ResolvingMetadata) {
  return sitePageMetadata(
    {
      title: "Changelog",
      description: `New features and fixes in each release of ${siteConfig.name}, the open-source Stripe dashboard for your office TV.`,
      path: "/changelog",
      types: { "application/rss+xml": "/changelog/rss.xml" },
    },
    parent,
  );
}

export default async function ChangelogPage() {
  const { releases } = await readChangelog();
  return (
    <ContentPage path="/changelog">
      <PageIntro eyebrow="Changelog" title="What's new in SaaS Monitor">
        <p>
          Every release, newest first. On your own server,{" "}
          <a
            href={`${siteConfig.selfHostingUrl}#updating`}
            className="text-(--ink) underline decoration-(--ink-3)/40 underline-offset-4 hover:decoration-current"
          >
            updating
          </a>{" "}
          takes two commands, and open screens reload on the new version by themselves.
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-2 text-base">
          <a
            href="/changelog/rss.xml"
            className="inline-flex items-center gap-1.5 text-(--ink-3) transition-colors hover:text-(--ink)"
          >
            <RssIcon aria-hidden className="size-4" />
            RSS feed
          </a>
          <SourceLink href={`${siteConfig.repositoryUrl}/releases`}>Releases on GitHub</SourceLink>
        </p>
      </PageIntro>

      <ol className="mx-auto max-w-6xl px-5 pt-16 sm:px-6">
        {releases.map((release) => (
          <ReleaseEntry key={release.anchor} release={release} />
        ))}
      </ol>
    </ContentPage>
  );
}

function ReleaseEntry({ release }: { release: Release }) {
  const unreleased = release.date === null;
  return (
    <li
      id={release.anchor}
      className="grid scroll-mt-20 gap-4 border-t border-(--hairline) py-10 md:grid-cols-[14rem_1fr] md:gap-10"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">
          <a href={`#${release.anchor}`} className="hover:text-(--glow)">
            {unreleased ? "Unreleased" : release.version}
          </a>
        </h2>
        <p className="text-sm text-(--ink-3)">
          {unreleased ? "On the main branch, in the next release" : formatDay(release.date!)}
        </p>
        {release.url && (
          <SourceLink href={release.url} className="mt-1 w-fit text-sm">
            {unreleased ? "Changes since the last release" : "Changes on GitHub"}
          </SourceLink>
        )}
      </div>
      <div className="max-w-3xl">
        <ChangelogBlocks blocks={release.blocks} />
      </div>
    </li>
  );
}

/** `2026-09-29` as "September 29, 2026": release days, not instants. */
function formatDay(day: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  );
}

import { ArrowRightIcon, PlayIcon } from "lucide-react";
import type { ResolvingMetadata } from "next";
import Link from "next/link";
import { ClosingCall } from "@/components/content/closing-call";
import { buttonClass } from "@/components/site/button-styles";
import { AlternativesTable, SourcesNote } from "@/components/content/comparison";
import { ContentPage, ContentSection, PageIntro } from "@/components/content/content-page";
import { ALTERNATIVES } from "@/lib/marketing/alternatives";
import { sitePageMetadata } from "@/lib/marketing/page-metadata";

export function generateMetadata(_: PageProps<"/[lang]/alternatives">, parent: ResolvingMetadata) {
  return sitePageMetadata(
    {
      title: "Alternatives: SaaS Monitor compared",
      description:
        "How SaaS Monitor, a free and open-source Stripe screen for the office TV, compares with Baremetrics, ChartMogul, Geckoboard, PingBell and ProfitWell Metrics.",
      path: "/alternatives",
    },
    parent,
  );
}

export default function AlternativesPage() {
  const names = ALTERNATIVES.map((alternative) => alternative.name);
  const others = `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return (
    <ContentPage path="/alternatives">
      <PageIntro
        eyebrow="Alternatives"
        title="A screen for the wall, next to the tools you already use"
        actions={
          <>
            <Link href="/d/demo" prefetch={false} className={buttonClass({ size: "lg" })}>
              <PlayIcon aria-hidden className="fill-current" />
              Open the live demo
            </Link>
            <Link
              href="/sign-up"
              prefetch={false}
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              Get started
              <ArrowRightIcon aria-hidden />
            </Link>
          </>
        }
      >
        <p>
          SaaS Monitor is not an analytics suite. It does one job: your Stripe revenue, live on the
          office TV, with a sound for every sale. Here is how it compares with the tools founders
          ask about, and when to run both.
        </p>
      </PageIntro>

      <ContentSection
        id="at-a-glance"
        title="At a glance"
        description="What each tool is made for, and what it costs, as its own site describes it."
      >
        <AlternativesTable alternatives={ALTERNATIVES} />
        <SourcesNote names={others} sources={[]} />
      </ContentSection>

      <ContentSection id="comparisons" title="Side by side">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ALTERNATIVES.map((alternative) => (
            <li key={alternative.slug}>
              <Link
                href={`/alternatives/${alternative.slug}`}
                className="group flex h-full flex-col gap-3 rounded-3xl bg-(--surface) p-5 shadow-(--edge) transition-[background-color,box-shadow] duration-150 outline-none hover:bg-(--surface-raised) hover:shadow-(--edge-hover) focus-visible:ring-2 focus-visible:ring-(--glow) sm:p-6"
              >
                <span className="text-xs text-(--ink-3)">{alternative.kind}</span>
                <span className="font-medium text-balance">
                  {alternative.name} and SaaS Monitor
                </span>
                <span className="text-sm text-pretty text-(--ink-2)">
                  {alternative.description}
                </span>
                <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm text-(--glow)">
                  Compare
                  <ArrowRightIcon
                    aria-hidden
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ClosingCall
        title="See it on a screen before you choose"
        actions={
          <>
            <Link href="/d/demo" prefetch={false} className={buttonClass({ size: "lg" })}>
              <PlayIcon aria-hidden className="fill-current" />
              Open the live demo
            </Link>
            <Link
              href="/stripe-notification-sound"
              prefetch={false}
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              Hear the sounds
            </Link>
          </>
        }
      >
        The demo runs a fictional SaaS where a sale lands every 20 seconds or so. Click once on the
        screen to turn the sound on.
      </ClosingCall>
    </ContentPage>
  );
}

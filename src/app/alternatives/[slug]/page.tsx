import { ArrowRightIcon, PlayIcon } from "lucide-react";
import type { ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClosingCall } from "@/components/content/closing-call";
import { ComparisonTable, PickWhich, SourcesNote } from "@/components/content/comparison";
import { ContentPage, ContentSection, PageIntro } from "@/components/content/content-page";
import { Faq } from "@/components/content/faq";
import { SourceLink } from "@/components/content/source-link";
import { Button } from "@/components/ui/button";
import { ALTERNATIVES, alternativeBySlug, sourcesOf } from "@/lib/marketing/alternatives";
import { contentMetadata } from "@/lib/marketing/page-metadata";

/** Every comparison is written in `src/lib/marketing/alternatives.ts`: other slugs are a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return ALTERNATIVES.map((alternative) => ({ slug: alternative.slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/alternatives/[slug]">,
  parent: ResolvingMetadata,
) {
  const alternative = alternativeBySlug((await params).slug);
  if (!alternative) notFound();
  return contentMetadata(
    {
      title: alternative.title,
      description: alternative.description,
      path: `/alternatives/${alternative.slug}`,
    },
    parent,
  );
}

export default async function AlternativePage({ params }: PageProps<"/alternatives/[slug]">) {
  const alternative = alternativeBySlug((await params).slug);
  if (!alternative) notFound();
  const others = ALTERNATIVES.filter((other) => other.slug !== alternative.slug);

  return (
    <ContentPage>
      <PageIntro
        eyebrow={`${alternative.name} alternative`}
        title={alternative.headline}
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="h-11 bg-(--ink) px-5 text-(--screen) hover:bg-white"
            >
              <Link href="/d/demo">
                <PlayIcon data-icon="inline-start" className="fill-current" />
                Open the live demo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5">
              <Link href="/sign-up">
                Get started
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </>
        }
      >
        <p>{alternative.description}</p>
        <p className="text-base text-(--ink-3)">
          {alternative.name}, in short: {lowerFirst(alternative.summary.text)}{" "}
          <SourceLink href={alternative.summary.source} className="text-sm whitespace-nowrap">
            Source
          </SourceLink>
        </p>
      </PageIntro>

      <ContentSection id="compared" title="Side by side">
        <ComparisonTable alternative={alternative} />
        <SourcesNote names={alternative.name} sources={sourcesOf(alternative)} />
      </ContentSection>

      <ContentSection id="which" title="Which one, when">
        <PickWhich alternative={alternative} />
      </ContentSection>

      <ContentSection id="both" title="Or use both">
        <p className="max-w-2xl text-lg text-pretty text-(--ink-2)">{alternative.together}</p>
      </ContentSection>

      <ContentSection id="questions" title="Questions">
        <Faq items={alternative.faq} />
      </ContentSection>

      <ContentSection id="more" title="Other comparisons">
        <ul className="flex flex-wrap gap-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/alternatives/${other.slug}`}
                className="inline-flex rounded-full px-3.5 py-1.5 text-sm text-(--ink-2) ring-1 ring-white/10 transition-colors outline-none hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)"
              >
                {other.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/alternatives"
              className="inline-flex rounded-full px-3.5 py-1.5 text-sm text-(--ink-2) ring-1 ring-white/10 transition-colors outline-none hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)"
            >
              All at a glance
            </Link>
          </li>
        </ul>
      </ContentSection>

      <ClosingCall
        title="Hear a sale land"
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="h-11 bg-(--ink) px-5 text-(--screen) hover:bg-white"
            >
              <Link href="/d/demo">
                <PlayIcon data-icon="inline-start" className="fill-current" />
                Open the live demo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </>
        }
      >
        The demo runs a fictional SaaS with a sale every few seconds. Click once on the screen to
        turn the sound on.
      </ClosingCall>
    </ContentPage>
  );
}

/** "Subscription analytics: …" reads on after "in short:". */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

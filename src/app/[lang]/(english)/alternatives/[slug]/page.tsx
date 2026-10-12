import { ArrowRightIcon, PlayIcon } from "lucide-react";
import type { ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClosingCall } from "@/components/content/closing-call";
import { buttonClass } from "@/components/site/button-styles";
import { ComparisonTable, PickWhich, SourcesNote } from "@/components/content/comparison";
import { ContentPage, ContentSection, PageIntro } from "@/components/content/content-page";
import { Faq } from "@/components/site/faq";
import { SourceLink } from "@/components/content/source-link";
import { ALTERNATIVES, alternativeBySlug, sourcesOf } from "@/lib/marketing/alternatives";
import { sitePageMetadata } from "@/lib/marketing/page-metadata";

/** Every comparison is written in `src/lib/marketing/alternatives.ts`: other slugs are a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return ALTERNATIVES.map((alternative) => ({ slug: alternative.slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/[lang]/alternatives/[slug]">,
  parent: ResolvingMetadata,
) {
  const alternative = alternativeBySlug((await params).slug);
  if (!alternative) notFound();
  return sitePageMetadata(
    {
      title: alternative.title,
      description: alternative.description,
      path: `/alternatives/${alternative.slug}`,
    },
    parent,
  );
}

export default async function AlternativePage({
  params,
}: PageProps<"/[lang]/alternatives/[slug]">) {
  const alternative = alternativeBySlug((await params).slug);
  if (!alternative) notFound();
  const others = ALTERNATIVES.filter((other) => other.slug !== alternative.slug);

  return (
    <ContentPage path={`/alternatives/${alternative.slug}`}>
      <PageIntro
        eyebrow={`${alternative.name} alternative`}
        title={alternative.headline}
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
        <Faq
          items={alternative.faq.map(({ question, answer }) => ({ question, answer: [answer] }))}
          links={{}}
        />
      </ContentSection>

      <ContentSection id="more" title="Other comparisons">
        <ul className="flex flex-wrap gap-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/alternatives/${other.slug}`}
                className="inline-flex rounded-full px-3.5 py-1.5 text-sm text-(--ink-2) shadow-(--edge) transition-[color,box-shadow] duration-150 outline-none hover:text-(--ink) hover:shadow-(--edge-hover) focus-visible:ring-2 focus-visible:ring-(--glow)"
              >
                {other.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/alternatives"
              className="inline-flex rounded-full px-3.5 py-1.5 text-sm text-(--ink-2) shadow-(--edge) transition-[color,box-shadow] duration-150 outline-none hover:text-(--ink) hover:shadow-(--edge-hover) focus-visible:ring-2 focus-visible:ring-(--glow)"
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

/** "Subscription analytics: …" reads on after "in short:". */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

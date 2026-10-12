import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { textLinkClass } from "@/components/site/button-styles";
import { Container, SectionHeading } from "@/components/site/section";
import type { SiteText } from "@/lib/site/i18n";

/**
 * From Stripe to the wall, in three steps along a line, rather than three more cards, and the
 * docs' guide that walks through them.
 */
export function SetupSteps({ text, guide }: { text: SiteText["steps"]; guide: string }) {
  return (
    <section aria-labelledby="steps-title" id="how-it-works" className="pt-24 sm:pt-36">
      <Container>
        <SectionHeading id="steps-title" eyebrow={text.eyebrow} title={text.title} />
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* The line the steps sit on. */}
          <span
            aria-hidden
            className="absolute top-5 right-[16%] left-5 hidden h-px bg-linear-to-r from-(--glow)/60 via-(--hairline) to-(--hairline) md:block"
          />
          {text.items.map((step, index) => (
            <li key={step.title} className="reveal relative flex gap-5 md:flex-col md:gap-6">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-(--screen) text-sm font-semibold text-(--glow) tabular-nums shadow-[0_0_0_1px_color-mix(in_oklab,var(--glow)_45%,transparent),0_0_24px_-6px_var(--glow)]">
                {index + 1}
              </span>
              <div>
                <h3 className="text-[1.0625rem] font-medium">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-pretty text-(--ink-2)">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="reveal mt-12">
          <Link
            href={guide}
            className={`${textLinkClass} inline-flex items-center gap-1.5 text-sm`}
          >
            {text.guide}
            <ArrowRightIcon aria-hidden className="size-4" />
          </Link>
        </p>
      </Container>
    </section>
  );
}

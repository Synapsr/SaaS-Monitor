import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/site/button-styles";
import { Container, SectionHeading } from "@/components/site/section";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";
import { cn } from "@/lib/utils";

type Plan = SiteText["pricing"]["hosted"];

/** What it costs: nothing online during the public beta, nothing ever on your own server. */
export function Pricing({ text }: { text: SiteText["pricing"] }) {
  return (
    <section aria-labelledby="pricing-title" id="pricing" className="pt-24 sm:pt-36">
      <Container>
        <SectionHeading
          id="pricing-title"
          align="center"
          eyebrow={text.eyebrow}
          title={text.title}
          lead={text.lead}
        />
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
          <PlanCard plan={text.hosted} highlighted>
            <Link
              href="/sign-up"
              prefetch={false}
              className={buttonClass({ size: "lg", className: "w-full" })}
            >
              {text.hosted.cta}
              <ArrowRightIcon aria-hidden />
            </Link>
          </PlanCard>
          <PlanCard plan={text.selfHosted}>
            <a
              href={siteConfig.selfHostingUrl}
              className={buttonClass({ variant: "secondary", size: "lg", className: "w-full" })}
            >
              {text.selfHosted.cta}
            </a>
          </PlanCard>
        </div>
      </Container>
    </section>
  );
}

function PlanCard({
  plan,
  highlighted = false,
  children,
}: {
  plan: Plan;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "reveal relative flex flex-col gap-7 overflow-hidden rounded-3xl p-6 sm:p-8",
        highlighted
          ? "bg-(--surface-raised) shadow-(--edge-glow)"
          : "bg-(--surface) shadow-(--edge)",
      )}
    >
      {highlighted && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,var(--glow-wash),transparent)]"
        />
      )}
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[1.0625rem] font-medium">{plan.name}</h3>
        <span className="rounded-full bg-(--glow)/10 px-2.5 py-0.5 text-xs text-(--glow) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_25%,transparent)]">
          {plan.badge}
        </span>
      </div>
      <p className="relative flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="text-5xl font-semibold tracking-[-0.04em]">{plan.price}</span>
        <span className="text-sm text-(--ink-2)">{plan.term}</span>
      </p>
      <ul className="relative flex flex-col gap-3 text-sm text-(--ink-2)">
        {plan.points.map((point) => (
          <li key={point} className="flex gap-3">
            <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-(--glow)" />
            <span className="text-pretty">{point}</span>
          </li>
        ))}
      </ul>
      <div className="relative mt-auto pt-2">{children}</div>
    </article>
  );
}

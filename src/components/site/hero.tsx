import { ArrowRightIcon, CheckIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/site/button-styles";
import { DemoTv } from "@/components/site/demo-tv";
import type { SiteText } from "@/lib/site/i18n";

/**
 * The promise, the two ways in (sign up, live demo), then the demo itself on a TV, lit by its own
 * glow. Its parts rise in one after the other.
 */
export function Hero({
  text,
  demo,
  embed,
  poster,
}: {
  text: Pick<SiteText, "hero" | "demo">;
  /** The live demo's page, in the page's language. */
  demo: string;
  /** The live demo to embed in the TV. */
  embed: string;
  poster: string;
}) {
  const { hero } = text;
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* The room's light: an emerald glow behind the TV, and the dots of a screen's backdrop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[72rem] bg-[radial-gradient(48%_38%_at_50%_58%,var(--glow-wash),transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[56rem] bg-(image:--dots) mask-[radial-gradient(60%_55%_at_50%_30%,black,transparent_75%)] bg-size-[22px_22px]"
      />

      <div className="mx-auto max-w-6xl px-5 pt-14 text-center sm:px-6 sm:pt-24">
        <p className="animate-rise inline-flex items-center gap-2.5 rounded-full bg-(--surface-raised) py-1.5 pr-3.5 pl-3 text-xs text-(--ink-2) shadow-(--edge)">
          <span className="relative flex size-2">
            <span className="animate-pulse-dot absolute inset-0 rounded-full bg-(--glow)" />
            <span className="relative size-2 rounded-full bg-(--glow) shadow-[0_0_10px_var(--glow)]" />
          </span>
          {hero.badge}
        </p>

        <h1
          id="hero-title"
          className="animate-rise text-hero mx-auto mt-7 max-w-4xl font-semibold text-balance [animation-delay:80ms]"
        >
          {hero.title.start}
          <span className="whitespace-nowrap text-(--glow) [text-shadow:0_0_40px_color-mix(in_oklab,var(--glow)_50%,transparent)]">
            {hero.title.highlight}
          </span>
          {hero.title.end}
        </h1>

        <p className="animate-rise text-lead mx-auto mt-6 max-w-2xl text-pretty text-(--ink-2) [animation-delay:160ms]">
          {hero.lead}
        </p>

        <div className="animate-rise mt-9 flex flex-col items-stretch justify-center gap-3 [animation-delay:240ms] min-[440px]:flex-row min-[440px]:items-center">
          <Link href="/sign-up" prefetch={false} className={buttonClass({ size: "lg" })}>
            {hero.primary}
            <ArrowRightIcon aria-hidden />
          </Link>
          <Link
            href={demo}
            prefetch={false}
            className={buttonClass({ variant: "secondary", size: "lg" })}
          >
            <PlayIcon aria-hidden className="fill-current" />
            {hero.secondary}
          </Link>
        </div>

        <ul className="animate-rise mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-(--ink-3) [animation-delay:320ms]">
          {hero.points.map((point) => (
            <li key={point} className="flex items-center gap-1.5">
              <CheckIcon aria-hidden className="size-3.5 text-(--glow)" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-rise-slow relative mx-auto mt-14 max-w-6xl px-3 [animation-delay:420ms] sm:mt-20 sm:px-6">
        <DemoTv text={text.demo} src={embed} standalone={demo} poster={poster} />
        {/* The TV's light on the floor. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[12%] bottom-6 -z-10 h-40 bg-[radial-gradient(50%_50%_at_50%_50%,var(--glow-faint),transparent)] blur-2xl"
        />
      </div>
    </section>
  );
}

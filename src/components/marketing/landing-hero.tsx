import { ArrowRightIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { DemoTv } from "@/components/marketing/demo-tv";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

/** The promise, the two ways in (sign up, live demo), and the demo itself on a TV. */
export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[64rem] bg-[radial-gradient(50%_40%_at_50%_45%,color-mix(in_oklab,var(--glow)_15%,transparent),transparent_75%)]"
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="inline-flex animate-in items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-xs text-(--ink-2) ring-1 ring-white/10 duration-700 fill-mode-both fade-in motion-reduce:animate-none">
          <span className="size-1.5 animate-pulse rounded-full bg-(--glow) shadow-[0_0_10px_var(--glow)]" />
          Public beta · Open source · Free
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl animate-in text-5xl font-semibold tracking-[-0.045em] text-balance delay-100 duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none sm:text-7xl">
          Your MRR,{" "}
          <span className="text-(--glow) [text-shadow:0_0_36px_color-mix(in_oklab,var(--glow)_45%,transparent)]">
            live
          </span>{" "}
          on the wall.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-in text-lg text-balance text-(--ink-2) delay-200 duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
          {siteConfig.name} turns your Stripe account into a beautiful screen for the office. Hear
          the ka-ching of every sale, watch your MRR climb and celebrate every milestone with your
          team.
        </p>
        <div className="mt-9 flex animate-in flex-wrap items-center justify-center gap-3 delay-300 duration-700 fill-mode-both fade-in motion-reduce:animate-none">
          <Button asChild size="lg" className="h-11 bg-(--ink) px-5 text-(--screen) hover:bg-white">
            <Link href="/sign-up">
              Get started, it’s free
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5">
            <Link href="/d/demo">
              <PlayIcon data-icon="inline-start" className="fill-current" />
              Open the live demo
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-(--ink-3)">
          Free during the public beta · Always free to self-host · Read-only Stripe key
        </p>
      </div>

      <div className="relative mx-auto mt-14 max-w-6xl animate-in px-4 delay-500 duration-1000 fill-mode-both fade-in slide-in-from-bottom-6 motion-reduce:animate-none sm:mt-20 sm:px-6">
        <DemoTv />
        <p className="mt-6 text-center text-sm text-(--ink-3)">
          The live demo, with a fictional SaaS. A sale lands every few seconds.
        </p>
      </div>
    </section>
  );
}

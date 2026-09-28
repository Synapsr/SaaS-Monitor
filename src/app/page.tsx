import { ArrowRightIcon, PlayIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { LogoMark } from "@/components/logo";
import { DemoTv } from "@/components/marketing/demo-tv";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { LandingHeader } from "@/components/marketing/landing-header";
import { SoundBoard } from "@/components/marketing/sound-board";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} · ${siteConfig.tagline}` },
};

const docsUrl = `${siteConfig.repositoryUrl}/tree/main/docs`;
const selfHostingUrl = `${siteConfig.repositoryUrl}/blob/main/docs/self-hosting.md`;

const STEPS = [
  {
    title: "Connect Stripe",
    description:
      "Create a read-only restricted key in one click and paste it. Your history is imported in about a minute.",
  },
  {
    title: "Make it yours",
    description:
      "Choose the sounds, the colors and your goal with a live preview. Every change is saved as you go.",
  },
  {
    title: "Put it on the wall",
    description:
      "Open the screen link on any TV, monitor or Raspberry Pi. No sign-in and nothing to install.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing dark min-h-svh">
      <LandingHeader />
      <main>
        <Hero />

        <Section
          id="features"
          title="Built to keep you going"
          description="Building a SaaS is a long game. Seeing it grow, sale after sale, is what keeps founders shipping."
        >
          <FeatureGrid />
        </Section>

        <Section
          id="sounds"
          title="Hear what a sale sounds like"
          description="Three sound packs, synthesized right in the browser: nothing to install. Pick one per screen, or keep the meeting room silent."
        >
          <SoundBoard />
        </Section>

        <Section id="how-it-works" title="On the wall in two minutes">
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl p-6 ring-1 ring-white/[0.08]">
                <span className="flex size-7 items-center justify-center rounded-full bg-(--glow)/15 text-sm font-medium text-(--glow) tabular-nums">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm text-pretty text-(--ink-2)">{step.description}</p>
              </li>
            ))}
          </ol>
        </Section>

        <SelfHost />
        <FinalCallToAction />
      </main>
      <LandingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[64rem] bg-[radial-gradient(50%_40%_at_50%_45%,color-mix(in_oklab,var(--glow)_15%,transparent),transparent_75%)]"
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="inline-flex animate-in items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-xs text-(--ink-2) ring-1 ring-white/10 duration-700 fill-mode-both fade-in motion-reduce:animate-none">
          <span className="size-1.5 animate-pulse rounded-full bg-(--glow) shadow-[0_0_10px_var(--glow)]" />
          Open source · Self-hosted · Free
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
          Two minutes to set up · Read-only Stripe key · Your data stays yours
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

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-28 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-pretty text-(--ink-2)">{description}</p>}
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}

function SelfHost() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-28 sm:px-6">
      <div className="grid items-center gap-10 rounded-3xl bg-white/[0.03] p-8 ring-1 ring-white/[0.08] md:grid-cols-2 md:p-12">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">Yours to run</h2>
          <p className="mt-3 text-pretty text-(--ink-2)">
            {siteConfig.name} is open source under the MIT license. Run it on your own server with
            Docker in two commands: your Stripe data never leaves it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href={selfHostingUrl}>Self-hosting guide</a>
            </Button>
            <Button asChild variant="ghost">
              <a href={siteConfig.repositoryUrl}>
                <GitHubIcon className="size-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-black/60 p-5 font-mono text-[0.8rem] leading-7 text-(--ink-2) ring-1 ring-white/10">
          <code>
            <span className="text-(--ink-3) select-none">$ </span>git clone{" "}
            {siteConfig.repositoryUrl}.git{"\n"}
            <span className="text-(--ink-3) select-none">$ </span>cd SaaS-Monitor && node
            scripts/setup.mjs{"\n"}
            <span className="text-(--ink-3) select-none">$ </span>docker compose up -d
          </code>
        </pre>
      </div>
    </section>
  );
}

function FinalCallToAction() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-32 text-center sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_50%_60%,color-mix(in_oklab,var(--glow)_12%,transparent),transparent_75%)]"
      />
      <h2 className="relative mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Keep going. Your next milestone is closer than you think.
      </h2>
      <div className="relative mt-9 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="h-11 bg-(--ink) px-5 text-(--screen) hover:bg-white">
          <Link href="/sign-up">
            Get started
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-11 px-5">
          <a href={siteConfig.repositoryUrl}>
            <GitHubIcon className="size-4" />
            Star on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-(--ink-3) sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2.5">
          <LogoMark className="size-5" />
          Open source under the MIT license.
        </p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/d/demo" className="hover:text-(--ink)">
            Live demo
          </Link>
          <a href={docsUrl} className="hover:text-(--ink)">
            Docs
          </a>
          <a href={siteConfig.repositoryUrl} className="hover:text-(--ink)">
            GitHub
          </a>
          <Link href="/sign-in" className="hover:text-(--ink)">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}

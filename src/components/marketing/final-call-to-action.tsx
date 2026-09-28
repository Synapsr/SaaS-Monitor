import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

/** The last word of the landing page: get started, or star the repository. */
export function FinalCallToAction() {
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

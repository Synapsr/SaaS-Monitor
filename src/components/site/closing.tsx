import { ArrowRightIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { buttonClass } from "@/components/site/button-styles";
import { LogoPulse } from "@/components/logo";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";

/** The last word: get started, or star the repository. Under the pulse of the logo, glowing. */
export function Closing({ text, stars }: { text: SiteText["closing"]; stars: string | null }) {
  return (
    <section
      aria-labelledby="closing-title"
      className="relative isolate mt-24 pt-16 sm:mt-36 sm:pt-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_60%_at_50%_45%,var(--glow-wash),transparent_75%)]"
      />
      <div className="reveal mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-6">
        <LogoPulse className="h-10 w-14 text-(--glow) drop-shadow-[0_0_18px_var(--glow)]" />
        <h2 id="closing-title" className="text-title mt-8 font-semibold text-balance">
          {text.title}
        </h2>
        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 min-[440px]:w-auto min-[440px]:flex-row">
          <Link href="/sign-up" prefetch={false} className={buttonClass({ size: "lg" })}>
            {text.primary}
            <ArrowRightIcon aria-hidden />
          </Link>
          <a
            href={siteConfig.repositoryUrl}
            className={buttonClass({ variant: "secondary", size: "lg" })}
          >
            <GitHubIcon />
            {text.secondary}
            {stars && (
              <span className="flex items-center gap-1 text-xs text-(--ink-3) tabular-nums">
                <StarIcon aria-hidden className="size-3! fill-current text-(--glow)" />
                {stars}
              </span>
            )}
          </a>
        </div>
      </div>
    </section>
  );
}

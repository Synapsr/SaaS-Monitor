import { ArrowLeftIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { LogoPulse } from "@/components/logo";
import { buttonClass } from "@/components/site/button-styles";
import type { SiteText } from "@/lib/site/i18n";

/** A missing page, on the site's stage: a flat line where the pulse should be, and two ways on. */
export function NotFoundContent({
  text,
  home,
  demo,
}: {
  text: SiteText["notFound"];
  home: string;
  demo: string;
}) {
  return (
    <section
      aria-labelledby="not-found-title"
      className="relative isolate flex min-h-[70svh] flex-col items-center justify-center px-5 py-24 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40%_45%_at_50%_45%,var(--glow-faint),transparent_75%)]"
      />
      <p
        aria-hidden
        className="text-[clamp(5rem,4rem+8vw,10rem)] leading-none font-semibold tracking-[-0.06em] text-(--ink-3)/40 tabular-nums"
      >
        404
      </p>
      <LogoPulse className="animate-rise mt-6 h-8 w-12 text-(--glow) drop-shadow-[0_0_14px_var(--glow)]" />
      <h1 id="not-found-title" className="text-title mt-8 max-w-xl font-semibold text-balance">
        {text.heading}
      </h1>
      <p className="text-lead mt-4 max-w-md text-pretty text-(--ink-2)">{text.text}</p>
      <div className="mt-9 flex flex-col gap-3 min-[440px]:flex-row">
        <Link href={home} className={buttonClass({ size: "lg" })}>
          <ArrowLeftIcon aria-hidden />
          {text.home}
        </Link>
        <Link
          href={demo}
          prefetch={false}
          className={buttonClass({ variant: "secondary", size: "lg" })}
        >
          <PlayIcon aria-hidden className="fill-current" />
          {text.demo}
        </Link>
      </div>
    </section>
  );
}

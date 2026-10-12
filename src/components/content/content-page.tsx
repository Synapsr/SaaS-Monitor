import { Eyebrow } from "@/components/site/section";
import { SitePage } from "@/components/site/site-page";
import type { SiteLanguage } from "@/lib/site/languages";

/** A page of the site beside the home page, with its header and footer. */
export function ContentPage({
  language = "en",
  path,
  children,
}: {
  language?: SiteLanguage;
  /** The page's address in English. */
  path: `/${string}`;
  children: React.ReactNode;
}) {
  return (
    <SitePage language={language} path={path}>
      <div className="pb-8">{children}</div>
    </SitePage>
  );
}

/** A section of a content page: a heading, an optional introduction, then its content. */
export function ContentSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-20 sm:px-6 sm:pt-28">
      <div className="reveal max-w-2xl">
        <h2 className="text-[clamp(1.75rem,1.4rem+1.4vw,2.375rem)] leading-tight font-semibold tracking-[-0.03em] text-balance">
          {title}
        </h2>
        {description && (
          <div className="mt-4 leading-relaxed text-pretty text-(--ink-2)">{description}</div>
        )}
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}

/** The page's heading, with a short answer or introduction under it. */
export function PageIntro({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(45%_50%_at_30%_20%,var(--glow-wash),transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-(image:--dots) mask-[radial-gradient(50%_60%_at_25%_20%,black,transparent_75%)] bg-size-[22px_22px]"
      />
      <div className="mx-auto max-w-6xl px-5 pt-14 sm:px-6 sm:pt-20">
        <Eyebrow className="animate-rise">{eyebrow}</Eyebrow>
        <h1 className="animate-rise mt-4 max-w-4xl text-[clamp(2.375rem,1.6rem+3.2vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance [animation-delay:80ms]">
          {title}
        </h1>
        <div className="animate-rise text-lead mt-6 flex max-w-2xl flex-col gap-4 text-pretty text-(--ink-2) [animation-delay:160ms]">
          {children}
        </div>
        {actions && (
          <div className="animate-rise mt-9 flex flex-wrap gap-3 [animation-delay:240ms]">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

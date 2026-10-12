import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import "@/app/landing.css";

/** A page of the site beside the landing page, with its header, footer and palette. */
export function ContentPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing dark min-h-svh">
      <LandingHeader />
      <main className="pb-8">{children}</main>
      <LandingFooter />
    </div>
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
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-20 sm:px-6 sm:pt-24">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        {description && <div className="mt-3 text-pretty text-(--ink-2)">{description}</div>}
      </div>
      <div className="mt-8">{children}</div>
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
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(45%_50%_at_30%_20%,color-mix(in_oklab,var(--glow)_12%,transparent),transparent_75%)]"
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-14 sm:px-6 sm:pt-20">
        <p className="text-sm font-medium text-(--glow)">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
          {title}
        </h1>
        <div className="mt-5 flex max-w-2xl flex-col gap-4 text-lg text-pretty text-(--ink-2)">
          {children}
        </div>
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}

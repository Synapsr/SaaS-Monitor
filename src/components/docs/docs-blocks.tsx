import { ArrowRightIcon, CheckIcon, type LucideIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { RichText } from "@/components/site/rich-text";
import { cn } from "@/lib/utils";

/*
 * The building blocks of the docs' pages, on the site's stage: sections with an anchor, short
 * paragraphs, lists of checks, steps along a line, callouts, pictures and cards.
 */

/** A section of a page, listed under "On this page": its heading links to itself. */
export function DocsSection({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("pt-16 first:pt-0", className)}>
      <h2
        id={`${id}-title`}
        className="text-[clamp(1.5rem,1.3rem+0.8vw,1.875rem)] leading-tight font-semibold tracking-[-0.03em] text-balance"
      >
        <a
          href={`#${id}`}
          className="group rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--glow)"
        >
          {title}
          <span
            aria-hidden
            className="ml-2 font-normal text-(--ink-3) opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            #
          </span>
        </a>
      </h2>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** A paragraph of a page, with the site's markup (links, emphasis, code). */
export function Paragraph({
  text,
  links,
  className,
}: {
  text: string;
  links: Record<string, string>;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "max-w-[42rem] text-[1.0625rem] leading-[1.7] text-pretty text-(--ink-2)",
        className,
      )}
    >
      <RichText text={text} links={links} />
    </p>
  );
}

/** Facts to tick off, each with a check in the glow. */
export function Checklist({
  items,
  links,
  className,
}: {
  items: readonly string[];
  links: Record<string, string>;
  className?: string;
}) {
  return (
    <ul className={cn("flex max-w-[42rem] flex-col gap-3.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[1.0625rem] leading-[1.6] text-(--ink-2)">
          <span
            aria-hidden
            className="mt-[0.2em] flex size-5 shrink-0 items-center justify-center rounded-full bg-(--glow)/12 text-(--glow)"
          >
            <CheckIcon className="size-3.5" strokeWidth={2.5} />
          </span>
          <span className="text-pretty">
            <RichText text={item} links={links} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Something to know before going on: lit in the glow when it reassures, quiet otherwise. */
export function Callout({
  icon: Icon,
  title,
  text,
  links,
  tone = "glow",
}: {
  icon: LucideIcon;
  title: string;
  /** With the site's markup. */
  text: string;
  links: Record<string, string>;
  tone?: "glow" | "quiet";
}) {
  return (
    <aside
      className={cn(
        "flex max-w-[42rem] gap-4 rounded-2xl p-5",
        tone === "glow"
          ? "bg-(--glow)/[0.05] shadow-(--edge-glow)"
          : "bg-(--surface) shadow-(--edge)",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          tone === "glow"
            ? "bg-(--glow)/12 text-(--glow)"
            : "bg-(--surface-raised) text-(--ink-2) shadow-(--edge)",
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 pt-1">
        <p className="font-medium text-(--ink)">{title}</p>
        <p className="mt-1.5 text-[0.975rem] leading-[1.65] text-pretty text-(--ink-2)">
          <RichText text={text} links={links} />
        </p>
      </div>
    </aside>
  );
}

export interface DocsStep {
  title: string;
  text: string;
  note?: string;
  /** Something to show under the step, such as a picture. */
  extra?: React.ReactNode;
}

/** Steps to follow in order, along a line, each with its anchor (`#step-1`). */
export function Steps({
  steps,
  links,
}: {
  steps: readonly DocsStep[];
  links: Record<string, string>;
}) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li
          key={step.title}
          id={`step-${index + 1}`}
          className="group/step relative flex gap-5 pb-10 last:pb-0"
        >
          <span
            aria-hidden
            className="absolute top-12 bottom-2 left-5 w-px -translate-x-1/2 bg-linear-to-b from-(--glow)/50 to-(--hairline) group-last/step:hidden"
          />
          <span
            aria-hidden
            className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-(--screen) text-sm font-semibold text-(--glow) tabular-nums shadow-[0_0_0_1px_color-mix(in_oklab,var(--glow)_45%,transparent),0_0_24px_-6px_var(--glow)]"
          >
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-col gap-2.5 pt-1.5">
            <h3 className="text-[1.1875rem] font-medium tracking-[-0.01em] text-balance">
              <span className="sr-only">{index + 1}. </span>
              {step.title}
            </h3>
            <p className="max-w-[40rem] text-[1.0625rem] leading-[1.7] text-pretty text-(--ink-2)">
              <RichText text={step.text} links={links} />
            </p>
            {step.note && (
              <p className="max-w-[40rem] text-[0.95rem] leading-[1.6] text-pretty text-(--ink-3)">
                <RichText text={step.note} links={links} />
              </p>
            )}
            {step.extra}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** A picture of the product, framed like the screens of the home page. */
export function Figure({
  image,
  alt,
  caption,
  sizes = "(min-width: 1280px) 680px, (min-width: 1024px) 70vw, 100vw",
  className,
}: {
  image: StaticImageData | { src: string; width: number; height: number };
  alt: string;
  caption?: React.ReactNode;
  sizes?: string;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <Image
        {...image}
        alt={alt}
        sizes={sizes}
        className="w-full rounded-2xl shadow-(--shadow-device) outline-1 -outline-offset-1 outline-(--image-outline)"
      />
      {caption && <figcaption className="text-sm text-pretty text-(--ink-3)">{caption}</figcaption>}
    </figure>
  );
}

export interface InfoCard {
  icon: LucideIcon;
  title: string;
  text: string;
  /** A word over the title, such as "Recommended". */
  badge?: string;
  /** Across the whole row: the card to start with. */
  wide?: boolean;
}

/** Facts side by side, each in a card with its icon. */
export function InfoCards({
  cards,
  links,
  columns = 2,
}: {
  cards: readonly InfoCard[];
  links: Record<string, string>;
  columns?: 2 | 3;
}) {
  return (
    <ul className={cn("grid gap-3", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {cards.map(({ icon: Icon, title, text, badge, wide }) => (
        <li
          key={title}
          className={cn(
            "flex flex-col gap-3 rounded-2xl p-5",
            wide && (columns === 3 ? "sm:col-span-3" : "sm:col-span-2"),
            badge ? "bg-(--glow)/[0.04] shadow-(--edge-glow)" : "bg-(--surface) shadow-(--edge)",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-xl bg-(--glow)/10 text-(--glow) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_25%,transparent)]"
            >
              <Icon className="size-4.5" />
            </span>
            {badge && (
              <span className="rounded-full bg-(--glow)/10 px-2.5 py-0.5 text-xs text-(--glow) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--glow)_25%,transparent)]">
                {badge}
              </span>
            )}
          </div>
          <h3 className="font-medium text-balance">{title}</h3>
          <p className="-mt-1 text-[0.95rem] leading-[1.6] text-pretty text-(--ink-2)">
            <RichText text={text} links={links} />
          </p>
        </li>
      ))}
    </ul>
  );
}

export interface PageCard {
  href: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Other pages to read, as cards that lead to them. */
export function PageCards({
  cards,
  columns = 2,
  className,
}: {
  cards: readonly PageCard[];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-3", columns === 2 && "sm:grid-cols-2", className)}>
      {cards.map(({ href, icon: Icon, title, text }) => (
        <li key={href} className="flex">
          <Link
            href={href}
            className="group flex w-full flex-col gap-3 rounded-2xl bg-(--surface) p-5 shadow-(--edge) transition-[background-color,box-shadow] duration-150 hover:bg-(--surface-raised) hover:shadow-(--edge-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)"
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--surface-raised) text-(--ink-2) shadow-(--edge) transition-colors duration-150 group-hover:text-(--glow)"
              >
                <Icon className="size-4.5" />
              </span>
              <span className="font-medium text-(--ink)">{title}</span>
              <ArrowRightIcon
                aria-hidden
                className="ml-auto size-4 shrink-0 text-(--ink-3) transition-[color,translate] duration-150 group-hover:translate-x-0.5 group-hover:text-(--ink)"
              />
            </span>
            <span className="text-[0.95rem] leading-[1.6] text-pretty text-(--ink-2)">{text}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import { LogoMark } from "@/components/logo";
import type { LanguageLink } from "@/components/site/language-list";
import { RichText } from "@/components/site/rich-text";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";
import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
  /** A page that only exists in English, on a page in another language. */
  english?: boolean;
}

export interface SiteFooterProps {
  text: SiteText["footer"];
  tagline: string;
  /** Where the links of its texts point (`siteLinks()`). */
  links: Record<string, string>;
  demo: string;
  sounds: string;
  /** Whether the page is in English: the English-only pages need no warning then. */
  english: boolean;
  languages: LanguageLink[];
}

const linkClass =
  "rounded-sm text-(--ink-3) transition-colors duration-150 hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)";

/**
 * Who makes it, under which license, whose trademark Stripe is; the product's pages, its code,
 * the legal pages, and every language, as crawlable links.
 */
export function SiteFooter({
  text,
  tagline,
  links,
  demo,
  sounds,
  english,
  languages,
}: SiteFooterProps) {
  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: text.columns.product,
      links: [
        { label: text.links.demo, href: demo },
        { label: text.links.docs, href: links.docs },
        { label: text.links.support, href: "/support", english: !english },
        { label: text.links.sounds, href: sounds },
        { label: text.links.alternatives, href: "/alternatives", english: !english },
        { label: text.links.changelog, href: "/changelog", english: !english },
      ],
    },
    {
      title: text.columns.openSource,
      links: [
        { label: text.links.github, href: siteConfig.repositoryUrl },
        { label: text.links.githubDocs, href: siteConfig.docsUrl },
        { label: text.links.selfHosting, href: links["doc-self-hosting"] },
      ],
    },
    {
      title: text.columns.legal,
      links: [
        { label: text.links.privacy, href: "/privacy", english: !english },
        { label: text.links.terms, href: "/terms", english: !english },
        { label: text.links.legalNotice, href: "/legal", english: !english },
      ],
    },
  ];

  return (
    <footer className="mt-24 shadow-[0_-1px_0_var(--hairline)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 pb-10 text-sm sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex max-w-sm flex-col gap-3 text-(--ink-3)">
          <p className="flex items-center gap-2.5 font-medium text-(--ink)">
            <LogoMark className="size-6" />
            {siteConfig.name}
          </p>
          <p className="text-(--ink-2)">{tagline}</p>
          <p>{text.license}</p>
          <p>
            <RichText text={text.madeBy} links={links} />
          </p>
          <p>
            <RichText text={text.help} links={links} />
          </p>
        </div>

        <nav
          aria-label={siteConfig.name}
          className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:gap-x-14"
        >
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3.5">
              <p className="font-medium text-(--ink-2)">{column.title}</p>
              <ul className="flex flex-col gap-2.5">
                {column.links.map(({ label, href, english: inEnglish }) => (
                  <li key={href}>
                    <FooterAnchor href={href} hrefLang={inEnglish ? "en" : undefined}>
                      {label}
                      {inEnglish && (
                        <span className="ml-1.5 rounded-sm px-1 py-px text-[0.625rem] text-(--ink-3) uppercase shadow-(--edge)">
                          <span className="sr-only">{text.inEnglish}</span>
                          <span aria-hidden>en</span>
                        </span>
                      )}
                    </FooterAnchor>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 pb-12 text-xs text-(--ink-3) sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-md text-pretty">{text.trademark}</p>
        <nav aria-label={text.languages}>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {languages.map(({ tag, name, href, current }) => (
              <li key={tag}>
                <a
                  href={href}
                  hrefLang={tag}
                  lang={tag}
                  aria-current={current ? "page" : undefined}
                  className={cn(linkClass, current && "text-(--ink)")}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

function FooterAnchor({
  href,
  hrefLang,
  children,
}: {
  href: string;
  hrefLang?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} hrefLang={hrefLang} className={linkClass}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={linkClass}>
      {children}
    </a>
  );
}

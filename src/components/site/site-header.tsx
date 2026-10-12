import { GlobeIcon, MenuIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { LogoMark } from "@/components/logo";
import { buttonClass } from "@/components/site/button-styles";
import { LanguageList, type LanguageLink } from "@/components/site/language-list";
import { MobileMenu, type MenuLink } from "@/components/site/mobile-menu";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";
import type { SiteLanguage } from "@/lib/site/languages";
import { localizedPath } from "@/lib/site/paths";
import { cn } from "@/lib/utils";

const navLinkClass =
  "rounded-full px-3 py-2.5 whitespace-nowrap text-(--ink-2) transition-colors duration-150 hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)";

export interface SiteHeaderProps {
  language: SiteLanguage;
  text: SiteText["nav"];
  /** The home page in this language: `/` or `/fr`. */
  home: string;
  /** The live demo, speaking this language. */
  demo: string;
  /** This page in every language. */
  languages: LanguageLink[];
  /** The repository's stars, when GitHub said. */
  stars: string | null;
  /** Whether the page is one of the docs: their link is lit. */
  inDocs?: boolean;
}

/**
 * Sticky, on frosted glass. Wide screens show the sections and the language menu; phones fold
 * them into a menu. Both open as popovers: no script for the language menu.
 */
export function SiteHeader({
  language,
  text,
  home,
  demo,
  languages,
  stars,
  inDocs = false,
}: SiteHeaderProps) {
  const docs = localizedPath(language, "/docs");
  const sections: MenuLink[] = [
    { label: text.demo, href: demo },
    { label: text.features, href: `${home}#features` },
    { label: text.apps, href: `${home}#apps` },
    { label: text.pricing, href: `${home}#pricing` },
    { label: text.docs, href: docs },
  ];

  return (
    <header className="sticky top-0 z-50 bg-(--screen)/72 shadow-[0_1px_0_var(--hairline)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link
          href={home}
          aria-label={text.home}
          className="-ml-1 flex items-center gap-2.5 rounded-lg p-1 font-semibold tracking-tight whitespace-nowrap focus-visible:outline-2 focus-visible:outline-(--glow)"
        >
          <LogoMark />
          <span>{siteConfig.name}</span>
        </Link>

        <nav aria-label={text.main} className="ml-4 hidden items-center text-sm lg:flex">
          {sections.map(({ label, href }) =>
            href.startsWith("/") ? (
              <Link
                key={href}
                href={href}
                aria-current={inDocs && href === docs ? "page" : undefined}
                className={cn(navLinkClass, "aria-[current=page]:text-(--ink)")}
              >
                {label}
              </Link>
            ) : (
              <a key={href} href={href} className={navLinkClass}>
                {label}
              </a>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <a
            href={siteConfig.repositoryUrl}
            aria-label={stars ? `${text.github} (${stars})` : text.github}
            className={cn(navLinkClass, "hidden items-center gap-1.5 tabular-nums sm:flex")}
          >
            <GitHubIcon className="size-4.5" />
            {stars && (
              <span className="flex items-center gap-1 text-xs">
                <StarIcon aria-hidden className="size-3 fill-current text-(--glow)" />
                {stars}
              </span>
            )}
          </a>

          <button
            type="button"
            popoverTarget="site-language-menu"
            aria-label={text.language}
            className={cn(
              navLinkClass,
              "hidden cursor-pointer items-center gap-1.5 text-sm uppercase [anchor-name:--site-language] md:flex",
            )}
          >
            <GlobeIcon aria-hidden className="size-4" />
            {language}
          </button>
          <div
            id="site-language-menu"
            popover="auto"
            className="menu-anchored w-56 rounded-[1.125rem] bg-(--popover) p-1.5 text-sm text-(--ink) shadow-(--shadow-popover) [position-anchor:--site-language]"
          >
            <LanguageList languages={languages} />
          </div>

          <Link
            href="/sign-in"
            className={cn(navLinkClass, "hidden text-sm md:block")}
            prefetch={false}
          >
            {text.signIn}
          </Link>
          <Link
            href="/sign-up"
            prefetch={false}
            className={buttonClass({
              size: "sm",
              className: "ml-1 hidden min-[380px]:inline-flex",
            })}
          >
            {text.getStarted}
          </Link>

          <button
            type="button"
            popoverTarget="site-mobile-menu"
            aria-label={text.menu}
            className="ml-1 flex size-10 cursor-pointer items-center justify-center rounded-full text-(--ink-2) transition-[color,background-color,scale] duration-150 hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--glow) active:scale-[0.96] lg:hidden"
          >
            <MenuIcon aria-hidden className="size-5" />
          </button>
          <MobileMenu
            id="site-mobile-menu"
            label={text.main}
            links={sections}
            languages={languages}
            languageLabel={text.language}
            signIn={{ label: text.signIn, href: "/sign-in" }}
            getStarted={{ label: text.getStarted, href: "/sign-up" }}
          />
        </div>
      </div>
    </header>
  );
}

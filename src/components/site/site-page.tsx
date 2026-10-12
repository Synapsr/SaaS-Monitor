import { LanguageHint, type LanguageOffer } from "@/components/site/language-hint";
import type { LanguageLink } from "@/components/site/language-list";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { formatCount } from "@/lib/site/format";
import { siteText, siteTexts } from "@/lib/site/i18n";
import {
  INTL_LOCALES,
  LANGUAGE_NAMES,
  LANGUAGE_TAGS,
  SITE_LANGUAGES,
  type SiteLanguage,
} from "@/lib/site/languages";
import { demoPath, localizedPath, pathIn } from "@/lib/site/paths";
import { siteLinks } from "@/lib/site/rich-text";
import { shownStars } from "@/server/github";

/**
 * A page of the public site in `language`: skip link, header, the page, footer, and the offer of
 * the visitor's own language. `path` is the page's address in English (`/privacy`), which the
 * language switcher finds again in other languages when the page is translated.
 */
export async function SitePage({
  language,
  path,
  children,
}: {
  language: SiteLanguage;
  path: `/${string}`;
  children: React.ReactNode;
}) {
  const text = siteText(language);
  const locale = INTL_LOCALES[language];
  const stars = await shownStars();
  const home = localizedPath(language, "/");

  const languages: LanguageLink[] = SITE_LANGUAGES.map((other) => ({
    tag: LANGUAGE_TAGS[other],
    name: LANGUAGE_NAMES[other],
    href: other === language ? localizedPath(language, path) : pathIn(other, path),
    current: other === language,
  }));
  const offers = Object.fromEntries(
    SITE_LANGUAGES.map((other) => [
      other,
      {
        tag: LANGUAGE_TAGS[other],
        ...siteTexts[other].languageHint,
        href: pathIn(other, path),
      } satisfies LanguageOffer,
    ]),
  ) as Record<SiteLanguage, LanguageOffer>;

  return (
    <>
      <a
        href="#content"
        className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-full bg-(--ink) px-4 py-2 text-sm font-medium text-(--screen) transition-transform duration-150 focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)"
      >
        {text.nav.skip}
      </a>
      <SiteHeader
        language={language}
        text={text.nav}
        home={home}
        demo={demoPath(language)}
        languages={languages}
        stars={stars === null ? null : formatCount(stars, locale)}
        inDocs={path === "/docs" || path.startsWith("/docs/")}
      />
      <main id="content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter
        text={text.footer}
        tagline={`${text.hero.title.start}${text.hero.title.highlight}${text.hero.title.end}`}
        links={siteLinks(language)}
        demo={demoPath(language)}
        sounds={localizedPath(language, "/stripe-notification-sound")}
        english={language === "en"}
        languages={languages}
      />
      <LanguageHint current={language} offers={offers} />
    </>
  );
}

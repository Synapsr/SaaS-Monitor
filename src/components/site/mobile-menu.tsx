"use client";

import Link from "next/link";
import { buttonClass } from "@/components/site/button-styles";
import { LanguageList, type LanguageLink } from "@/components/site/language-list";

export interface MenuLink {
  label: string;
  href: string;
}

/**
 * The header's links on small screens: a sheet under the header, opened by the menu button
 * (`popovertarget`), closed by a tap outside, Escape or any of its links, which may lead to a
 * section of the page it covers.
 */
export function MobileMenu({
  id,
  label,
  links,
  languages,
  languageLabel,
  signIn,
  getStarted,
}: {
  id: string;
  label: string;
  links: MenuLink[];
  languages: LanguageLink[];
  languageLabel: string;
  signIn: MenuLink;
  getStarted: MenuLink;
}) {
  function closeOnLink(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("a")) event.currentTarget.hidePopover();
  }

  return (
    <div
      id={id}
      popover="auto"
      onClick={closeOnLink}
      className="menu-sheet rounded-3xl bg-(--popover) p-2 text-(--ink) shadow-(--shadow-popover)"
    >
      <nav aria-label={label}>
        <ul className="flex flex-col">
          {links.map(({ label: text, href }) => (
            <li key={href}>
              {href.startsWith("/") ? (
                <Link href={href} className={itemClass}>
                  {text}
                </Link>
              ) : (
                <a href={href} className={itemClass}>
                  {text}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="mx-3 my-2 h-px bg-(--hairline)" />
      <p className="px-4 pt-2 pb-1 text-xs text-(--ink-3)">{languageLabel}</p>
      <LanguageList
        languages={languages}
        className="grid grid-cols-2 [&_a]:rounded-2xl [&_a]:px-4"
      />
      <div className="mt-2 grid grid-cols-2 gap-2 p-2">
        <Link
          href={signIn.href}
          prefetch={false}
          className={buttonClass({ variant: "secondary", size: "md" })}
        >
          {signIn.label}
        </Link>
        <Link href={getStarted.href} prefetch={false} className={buttonClass({ size: "md" })}>
          {getStarted.label}
        </Link>
      </div>
    </div>
  );
}

const itemClass =
  "flex min-h-12 items-center rounded-2xl px-4 text-[1.0625rem] text-(--ink) transition-colors duration-150 hover:bg-(--surface-raised) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--glow)";

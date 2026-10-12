import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LanguageLink {
  /** BCP 47, for `hreflang` and `lang`. */
  tag: string;
  /** The language in itself: "Français". */
  name: string;
  href: string;
  current: boolean;
}

/**
 * Every language of the site, each named in itself, linking to this page in it. Plain links: a
 * new language is a new document, whose `<html lang>` changes.
 */
export function LanguageList({
  languages,
  className,
}: {
  languages: LanguageLink[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {languages.map(({ tag, name, href, current }) => (
        <li key={tag}>
          <a
            href={href}
            hrefLang={tag}
            lang={tag}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 text-(--ink-2) transition-colors duration-150 hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--glow)",
              current && "text-(--ink)",
            )}
          >
            {name}
            {current && <CheckIcon aria-hidden className="size-4 text-(--glow)" />}
          </a>
        </li>
      ))}
    </ul>
  );
}

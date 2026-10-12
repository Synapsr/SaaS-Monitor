import { ContainerIcon, EyeOffIcon, LanguagesIcon, ScaleIcon, StarIcon } from "lucide-react";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";

/**
 * What can be checked rather than claimed: the stars the repository really has (when GitHub
 * says), its license, where it runs, its languages, and what it doesn't do.
 */
export function ProofBar({
  text,
  stars,
  selfHosting,
}: {
  text: SiteText["proof"];
  stars: string | null;
  /** The docs' page on self-hosting, in the page's language. */
  selfHosting: string;
}) {
  const facts = [
    { icon: ScaleIcon, label: text.license, href: siteConfig.licenseUrl },
    { icon: ContainerIcon, label: text.selfHost, href: selfHosting },
    { icon: LanguagesIcon, label: text.languages },
    { icon: EyeOffIcon, label: text.privacy },
  ];

  return (
    <div className="mx-auto mt-16 max-w-6xl px-5 sm:px-6">
      <ul
        aria-label={text.label}
        className="reveal flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-(--ink-3)"
      >
        <li>
          <a
            href={siteConfig.repositoryUrl}
            className="group flex items-center gap-2 rounded-full bg-(--surface-raised) py-1.5 pr-3.5 pl-3 text-(--ink-2) tabular-nums shadow-(--edge) transition-[box-shadow,color] duration-150 hover:text-(--ink) hover:shadow-(--edge-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)"
          >
            <StarIcon
              aria-hidden
              className="size-3.5 fill-(--glow) text-(--glow) transition-transform duration-300 ease-out group-hover:rotate-[72deg]"
            />
            {stars ? text.stars(stars) : text.star}
          </a>
        </li>
        {facts.map(({ icon: Icon, label, href }) => (
          <li key={label} className="flex items-center gap-2">
            <Icon aria-hidden className="size-4 text-(--ink-3)" />
            {href ? (
              <a
                href={href}
                className="rounded-sm transition-colors duration-150 hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow)"
              >
                {label}
              </a>
            ) : (
              label
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

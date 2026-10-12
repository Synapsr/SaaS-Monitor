"use client";

import { XIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { preferredLanguage, type SiteLanguage } from "@/lib/site/languages";

export interface LanguageOffer {
  /** BCP 47, for the hint's own `lang`. */
  tag: string;
  text: string;
  action: string;
  dismiss: string;
  href: string;
}

const DISMISSED_KEY = "saas-monitor:language-hint";

const noSubscription = () => () => {};

function browserLanguage(): SiteLanguage | null {
  return preferredLanguage(
    navigator.languages?.length ? navigator.languages : [navigator.language],
  );
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * A quiet offer, in their own language, to visitors whose browser prefers another language the
 * site speaks. Never a redirect: the address decides the language, for crawlers and for links
 * people share. Dismissed once, it stays away.
 */
export function LanguageHint({
  current,
  offers,
}: {
  current: SiteLanguage;
  offers: Record<SiteLanguage, LanguageOffer>;
}) {
  const preferred = useSyncExternalStore(noSubscription, browserLanguage, () => null);
  const dismissedBefore = useSyncExternalStore(noSubscription, wasDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);

  if (!preferred || preferred === current || dismissedBefore || dismissed) return null;
  const offer = offers[preferred];

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage may be off: the hint then comes back on the next page, which is fine.
    }
  }

  return (
    <aside
      lang={offer.tag}
      className="animate-rise fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center gap-2 rounded-[1.375rem] bg-(--popover) py-1.5 pr-1.5 pl-4 text-sm shadow-(--shadow-popover) sm:bottom-5"
    >
      <p className="min-w-0 flex-1 leading-snug text-pretty text-(--ink-2)">{offer.text}</p>
      <a
        href={offer.href}
        hrefLang={offer.tag}
        onClick={dismiss}
        className="shrink-0 rounded-full bg-(--ink) px-3.5 py-1.5 font-medium text-(--screen) transition-[background-color,scale] duration-150 hover:bg-(--ink-bright) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow) active:scale-[0.96]"
      >
        {offer.action}
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label={offer.dismiss}
        className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-(--ink-3) transition-[color,background-color] duration-150 after:absolute after:-inset-1 hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--glow)"
      >
        <XIcon aria-hidden className="size-4" />
      </button>
    </aside>
  );
}

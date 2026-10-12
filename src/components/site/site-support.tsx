"use client";

import { LoaderCircleIcon, MessageCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { startGleap } from "@/lib/gleap";
import type { SiteText } from "@/lib/site/i18n";
import type { SiteLanguage } from "@/lib/site/languages";
import { cn } from "@/lib/utils";

/** Past this, the widget is likely blocked (an ad blocker): the button writes an email instead. */
const START_TIMEOUT_MS = 10_000;

/**
 * A help button in the corner of the site's pages, on an instance that sets `GLEAP_API_KEY`
 * (`/api/support`). It loads Gleap's widget only once clicked: visitors who don't ask for help
 * load no third-party script and keep nothing on their device.
 */
export function SiteSupport({
  text,
  language,
  email,
}: {
  text: SiteText["support"];
  language: SiteLanguage;
  /** Where to write when the widget can't start. */
  email: string;
}) {
  const [sdkKey, setSdkKey] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/support", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((support: { gleap: string | null } | null) => setSdkKey(support?.gleap ?? null))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!sdkKey) return null;
  const key = sdkKey;

  async function open() {
    if (opening) return;
    setOpening(true);
    const timeout = new Promise<null>((resolve) => setTimeout(resolve, START_TIMEOUT_MS, null));
    const gleap = await Promise.race([
      startGleap(key, { launcher: false, language }),
      timeout,
    ]).catch(() => null);
    setOpening(false);
    if (gleap) gleap.open();
    else window.location.href = `mailto:${email}`;
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`${text.label} ${text.action}`}
      aria-busy={opening}
      className={cn(
        "animate-rise fixed right-4 bottom-4 z-40 inline-flex size-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-(--popover) text-sm font-medium text-(--ink) shadow-(--shadow-popover) outline-none select-none sm:right-5 sm:bottom-5 sm:h-11 sm:w-auto sm:pr-4.5 sm:pl-4",
        "transition-[bottom,background-color,scale] duration-200 ease-out hover:bg-[color-mix(in_oklab,var(--popover),var(--ink)_7%)] focus-visible:ring-2 focus-visible:ring-(--glow) focus-visible:ring-offset-2 focus-visible:ring-offset-(--screen) active:scale-[0.96]",
        // Above the offer of another language, which spans the bottom of narrow screens.
        "max-md:[body:has([data-language-hint])_&]:bottom-22",
      )}
    >
      {opening ? (
        <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin text-(--ink-2)" />
      ) : (
        <MessageCircleIcon aria-hidden="true" className="size-5 text-(--glow)" />
      )}
      <span aria-hidden="true" className="hidden sm:inline">
        {text.label}
      </span>
    </button>
  );
}

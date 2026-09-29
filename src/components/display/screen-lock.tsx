"use client";

import { LockIcon } from "lucide-react";
import { useActionState, useId, type CSSProperties } from "react";
import { unlockScreenAction } from "@/app/d/[token]/actions";
import { ScreenMessage } from "@/components/display/screen-message";
import { LogoPulse } from "@/components/logo";
import { accentPalette, accentVariables } from "@/lib/display/accents";
import { displayLocale } from "@/lib/display/i18n";
import type { Accent, Language, Theme } from "@/lib/screens/settings";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

interface ScreenLockProps {
  token: string;
  language: Language;
  theme: Theme;
  accent: Accent;
}

/**
 * Asks for the password of a screen that has one, once per device: large enough to type with a
 * TV remote, in the screen's own language and colors. Nothing else of the screen shows.
 */
export function ScreenLock({ token, language, theme, accent }: ScreenLockProps) {
  const { text } = displayLocale(language);
  const [error, unlock, pending] = useActionState(unlockScreenAction.bind(null, token), null);
  const id = useId();

  return (
    <div
      data-theme={theme}
      style={accentVariables(accentPalette(accent, theme)) as CSSProperties}
      className="display fixed inset-0 flex flex-col overflow-hidden px-13 pt-10 pb-12"
    >
      <p className="flex items-center gap-4 text-2xl font-medium tracking-tight">
        <LogoPulse className="h-6 text-(--glow)" />
        {siteConfig.name}
      </p>
      <ScreenMessage icon={<LockIcon />} title={text.lock.title}>
        <p>{text.lock.details}</p>
        <form action={unlock} className="flex w-[min(calc(var(--rem)*34),100%)] flex-col gap-4">
          <label htmlFor={`${id}-password`} className="sr-only">
            {text.lock.password}
          </label>
          <input
            id={`${id}-password`}
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder={text.lock.password}
            aria-invalid={error !== null}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-16 rounded-2xl bg-(--surface) px-6 text-center text-2xl text-(--ink) ring-1 ring-(--hairline) outline-none placeholder:text-(--ink-3) focus-visible:ring-2 focus-visible:ring-(--glow) aria-invalid:ring-(--warn)"
          />
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "h-16 rounded-2xl bg-(--glow) text-2xl font-semibold text-(--screen) transition-[opacity,scale] duration-150 outline-none focus-visible:ring-4 focus-visible:ring-(--glow)/40 active:scale-[0.98]",
              pending && "opacity-60",
            )}
          >
            {text.lock.open}
          </button>
          {error && (
            <p id={`${id}-error`} role="alert" className="text-xl text-(--warn-ink)">
              {error === "wrong-password" ? text.lock.wrongPassword : text.lock.tooManyAttempts}
            </p>
          )}
        </form>
      </ScreenMessage>
    </div>
  );
}

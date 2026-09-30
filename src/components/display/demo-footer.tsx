import { ArrowRightIcon } from "lucide-react";
import { useDisplayLocale } from "@/hooks/use-display-locale";
import type { RecurringMetric } from "@/lib/display/metric";
import { cn } from "@/lib/utils";

interface DemoFooterProps {
  /** The screen's metric, which the invitation names: "Put your own ARR on the wall". */
  metric: RecurringMetric["label"];
  /** Where visitors create an account; `null` on a server that only lets invited people in. */
  signUpHref: string | null;
  /** Nobody moved the mouse for a few seconds. */
  idle: boolean;
}

/**
 * The bottom of the standalone demo, above moments and milestones. Its label always shows, so that
 * no screenshot of the demo passes for real revenue. The invitation to sign up fades away with the
 * cursor, like the screen's controls, to stay out of recordings of a screen nobody touches; touch
 * screens keep it, having no cursor to wake it up.
 *
 * Its text never goes below a phone's readable size, where the rest of the screen is drawn small.
 */
export function DemoFooter({ metric, signUpHref, idle }: DemoFooterProps) {
  const { text } = useDisplayLocale();
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-35 flex h-(--bottom-band) items-center justify-between gap-6 px-13 text-[length:max(var(--text-lg),12px)] whitespace-nowrap">
      <p className="rounded-full bg-(--surface) px-[0.9em] py-[0.4em] text-(--ink-2) ring-1 ring-(--hairline)">
        {text.demo.label}
      </p>
      {signUpHref && (
        <div
          className={cn(
            "flex min-w-0 items-center gap-[0.9em] transition-opacity duration-300",
            idle && "opacity-0 pointer-coarse:opacity-100",
          )}
        >
          <p className="truncate text-(--ink-2) max-sm:hidden">{text.demo.pitch(metric)}</p>
          <a
            href={signUpHref}
            // The demo may be framed by another page: signing up takes the whole window.
            target="_top"
            className={cn(
              "flex shrink-0 items-center gap-[0.4em] rounded-full bg-(--ink) py-[0.4em] pr-[0.9em] pl-[1.1em] font-medium text-(--screen) transition-[background-color,scale] duration-150 hover:bg-(--ink)/85 focus-visible:ring-2 focus-visible:ring-(--glow) focus-visible:ring-offset-2 focus-visible:ring-offset-(--screen) focus-visible:outline-none active:scale-[0.96]",
              idle
                ? "pointer-events-none pointer-coarse:pointer-events-auto"
                : "pointer-events-auto",
            )}
          >
            {text.demo.start}
            <ArrowRightIcon aria-hidden className="size-[1em]" />
          </a>
        </div>
      )}
    </footer>
  );
}

import { RichText } from "@/components/site/rich-text";
import { SourceLink } from "./source-link";

/**
 * Numbered steps to follow somewhere else (a phone, an app), with where they come from. Steps may
 * stress a menu's name (`**Settings**`).
 */
export function StepsCard({
  title,
  steps,
  note,
  sourceLabel,
  sources,
}: {
  title: string;
  steps: readonly string[];
  note?: string;
  /** "Source:", in the page's language. */
  sourceLabel: string;
  sources: { href: string; label: string }[];
}) {
  return (
    <article className="reveal flex flex-col gap-5 rounded-3xl bg-(--surface) p-5 shadow-(--edge) sm:p-6">
      <h3 className="text-[1.0625rem] font-medium">{title}</h3>
      <ol className="flex flex-col gap-3.5 text-sm text-(--ink-2)">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--glow)/10 text-xs font-medium text-(--glow) tabular-nums"
            >
              {index + 1}
            </span>
            <span className="pt-0.5 leading-relaxed text-pretty">
              <RichText text={step} links={{}} />
            </span>
          </li>
        ))}
      </ol>
      {note && <p className="text-sm text-pretty text-(--ink-3)">{note}</p>}
      <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-(--hairline) pt-4 text-xs">
        <span className="text-(--ink-3)">{sourceLabel}</span>
        {sources.map((source) => (
          <SourceLink key={source.href} href={source.href}>
            {source.label}
          </SourceLink>
        ))}
      </p>
    </article>
  );
}

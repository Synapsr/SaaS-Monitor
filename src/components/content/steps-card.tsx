import { SourceLink } from "./source-link";

/** Numbered steps to follow somewhere else (a phone, an app), with where they come from. */
export function StepsCard({
  title,
  steps,
  note,
  sources,
}: {
  title: string;
  steps: React.ReactNode[];
  note?: React.ReactNode;
  sources: { href: string; label: string }[];
}) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.08] sm:p-6">
      <h3 className="font-medium">{title}</h3>
      <ol className="flex flex-col gap-3 text-sm text-(--ink-2)">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs text-(--ink) tabular-nums"
            >
              {index + 1}
            </span>
            <span className="text-pretty">{step}</span>
          </li>
        ))}
      </ol>
      {note && <p className="text-sm text-pretty text-(--ink-3)">{note}</p>}
      <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] pt-4 text-xs">
        <span className="text-(--ink-3)">Source:</span>
        {sources.map((source) => (
          <SourceLink key={source.href} href={source.href}>
            {source.label}
          </SourceLink>
        ))}
      </p>
    </article>
  );
}

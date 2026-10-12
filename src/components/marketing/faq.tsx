import { PlusIcon } from "lucide-react";

export interface Question {
  question: string;
  /** A sentence or two, or paragraphs of their own. */
  answer: React.ReactNode;
}

/**
 * Questions and their answers, each folded until opened. Native disclosures: every answer is in
 * the page's HTML, for search engines, and opens without JavaScript.
 */
export function Faq({ items }: { items: readonly Question[] }) {
  return (
    <div className="max-w-3xl border-t border-white/[0.08]">
      {items.map(({ question, answer }) => (
        <details key={question} className="group border-b border-white/[0.08]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-5 font-medium text-(--ink) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow) [&::-webkit-details-marker]:hidden">
            {question}
            <PlusIcon
              aria-hidden
              className="size-4 shrink-0 text-(--ink-3) transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
            />
          </summary>
          <div className="flex max-w-2xl flex-col gap-3 pb-6 text-pretty text-(--ink-2)">
            {typeof answer === "string" ? <p>{answer}</p> : answer}
          </div>
        </details>
      ))}
    </div>
  );
}

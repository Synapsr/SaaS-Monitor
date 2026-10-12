import { PlusIcon } from "lucide-react";
import { RichText } from "@/components/site/rich-text";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  /** Paragraphs, with their links (`[words](key)`). */
  answer: string[];
}

/**
 * Questions and their answers, each folded until opened. Native disclosures: every answer is in
 * the page's HTML, for search engines and assistants, and opens without JavaScript.
 */
export function Faq({
  items,
  links,
  className,
}: {
  items: readonly FaqItem[];
  links: Record<string, string>;
  className?: string;
}) {
  return (
    <div className={cn("shadow-[0_-1px_0_var(--hairline)]", className)}>
      {items.map(({ question, answer }) => (
        <details key={question} className="group shadow-[0_1px_0_var(--hairline)]">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-4 text-[1.0625rem] font-medium text-(--ink) transition-colors duration-150 outline-none hover:text-(--ink-bright) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glow) [&::-webkit-details-marker]:hidden">
            <span className="text-balance">{question}</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--surface-raised) text-(--ink-2) shadow-(--edge) transition-[background-color,color] duration-200 group-open:bg-(--glow)/10 group-open:text-(--glow)">
              <PlusIcon
                aria-hidden
                className="ease-out-soft size-4 transition-transform duration-300 group-open:rotate-45"
              />
            </span>
          </summary>
          <div className="flex max-w-2xl flex-col gap-3 pr-12 pb-6 leading-relaxed text-pretty text-(--ink-2)">
            {answer.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} links={links} />
              </p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

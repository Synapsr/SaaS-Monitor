import { ChevronDownIcon } from "lucide-react";

/** Questions and their answers, each folded until opened: no script needed. */
export function Faq({ items }: { items: { question: string; answer: React.ReactNode }[] }) {
  return (
    <div className="max-w-3xl divide-y divide-white/[0.08] rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.08]">
      {items.map((item) => (
        <details key={item.question} className="group px-5 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium outline-none focus-visible:text-(--glow) [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDownIcon
              aria-hidden
              className="size-4 shrink-0 text-(--ink-3) transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="-mt-1 pb-5 text-pretty text-(--ink-2)">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

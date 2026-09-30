import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The building blocks of the legal pages' prose, on the landing page's palette. */

const linkClass =
  "font-medium text-(--ink) underline decoration-(--ink-3) underline-offset-4 transition-colors hover:decoration-(--ink) focus-visible:outline-2 focus-visible:outline-(--glow)";

/** A link in running text: a page of the site, another site or an email address. */
export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={linkClass}>
      {children}
    </a>
  );
}

export function EmailLink({ email }: { email: string }) {
  return <TextLink href={`mailto:${email}`}>{email}</TextLink>;
}

/** A cookie's or a setting's name, as the browser or the code spells it. */
export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] break-words text-(--ink)">
      {children}
    </code>
  );
}

export function Emphasis({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-(--ink)">{children}</strong>;
}

export function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-(--ink-3)">{children}</ul>;
}

/** A subheading within a section, for its parts. */
export function Subheading({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 font-medium text-(--ink)">{children}</h3>;
}

export interface Fact {
  term: React.ReactNode;
  description: React.ReactNode;
  /** A detail under the description, such as a lifetime or a location. */
  note?: React.ReactNode;
}

/** Terms and what they mean, side by side where there is room and stacked on phones. */
export function FactList({ facts, className }: { facts: Fact[]; className?: string }) {
  return (
    <dl
      className={cn(
        "divide-y divide-white/[0.06] rounded-xl bg-white/[0.02] text-sm ring-1 ring-white/[0.08]",
        className,
      )}
    >
      {facts.map(({ term, description, note }, index) => (
        <div
          key={index}
          className="grid gap-1 px-4 py-3.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="font-medium text-(--ink)">{term}</dt>
          <dd className="leading-6 text-(--ink-2)">
            {description}
            {note && <span className="mt-1 block text-(--ink-3)">{note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** What to remember from a page, before its details. */
export function LegalSummary({ title, points }: { title: string; points: React.ReactNode[] }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08]">
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-4 flex flex-col gap-3 text-sm leading-6 text-(--ink-2)">
        {points.map((point, index) => (
          <li key={index} className="flex gap-3">
            <CheckIcon aria-hidden className="mt-1 size-4 shrink-0 text-(--glow)" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

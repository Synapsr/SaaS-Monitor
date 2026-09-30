import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import {
  formatCheckedDate,
  type Alternative,
  type ComparisonRow,
} from "@/lib/marketing/alternatives";
import { siteConfig } from "@/lib/site";
import { SourceLink } from "./source-link";

/**
 * Another product and SaaS Monitor side by side, topic by topic, each fact about the other
 * product linked to the page it comes from. On phones, each topic stacks its two sides.
 */
export function ComparisonTable({ alternative }: { alternative: Alternative }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/[0.08]">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          {alternative.name} and {siteConfig.name} compared
        </caption>
        <thead className="hidden bg-white/[0.03] md:table-header-group">
          <tr>
            <th scope="col" className="w-44 px-5 py-4 font-medium text-(--ink-3)">
              <span className="sr-only">Topic</span>
            </th>
            <th scope="col" className="px-5 py-4 font-medium">
              {alternative.name}
            </th>
            <th scope="col" className="px-5 py-4 font-medium">
              <span className="flex items-center gap-2">
                <LogoMark className="size-4" />
                {siteConfig.name}
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {alternative.rows.map((row) => (
            <Row key={row.topic} row={row} name={alternative.name} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row, name }: { row: ComparisonRow; name: string }) {
  return (
    <tr className="flex flex-col gap-3 px-5 py-4 md:table-row md:p-0">
      <th
        scope="row"
        className="font-medium text-(--ink) md:px-5 md:py-4 md:align-top md:text-(--ink-3)"
      >
        {row.topic}
      </th>
      <td className="text-(--ink-2) md:px-5 md:py-4 md:align-top">
        <span className="mb-1 block text-xs text-(--ink-3) md:hidden">{name}</span>
        {row.them.text}.{" "}
        <SourceLink href={row.them.source} className="text-xs whitespace-nowrap">
          Source
          <span className="sr-only">
            : {name}, checked {formatCheckedDate(row.them.checked)}
          </span>
        </SourceLink>
      </td>
      <td className="text-(--ink) md:bg-(--glow)/[0.03] md:px-5 md:py-4 md:align-top">
        <span className="mb-1 block text-xs text-(--glow) md:hidden">{siteConfig.name}</span>
        {row.us}.
      </td>
    </tr>
  );
}

/** When to pick the other product, and when to pick SaaS Monitor: two honest lists. */
export function PickWhich({ alternative }: { alternative: Alternative }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PickList title={`Pick ${alternative.name} when`} points={alternative.pickThem} />
      <PickList title={`Pick ${siteConfig.name} when`} points={alternative.pickUs} highlight />
    </div>
  );
}

function PickList({
  title,
  points,
  highlight = false,
}: {
  title: string;
  points: string[];
  highlight?: boolean;
}) {
  return (
    <article
      className={
        highlight
          ? "rounded-2xl bg-(--glow)/[0.04] p-5 ring-1 ring-(--glow)/20 sm:p-6"
          : "rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.08] sm:p-6"
      }
    >
      <h3 className="font-medium">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-(--ink-2)">
        {points.map((point) => (
          <li key={point} className="flex gap-2.5">
            <CheckIcon
              aria-hidden
              className={
                highlight ? "mt-0.5 size-4 shrink-0 text-(--glow)" : "mt-0.5 size-4 shrink-0"
              }
            />
            <span className="text-pretty">{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/** Where the facts come from, when they were read, and who to tell when they change. */
export function SourcesNote({ names, sources }: { names: string; sources: string[] }) {
  return (
    <div className="mt-6 max-w-3xl text-xs text-pretty text-(--ink-3)">
      <p>
        Facts about {names} come from their own websites, checked on{" "}
        {formatCheckedDate("2026-09-30")}. Prices and plans change: follow the sources for the
        current ones, and{" "}
        <a
          href={`${siteConfig.repositoryUrl}/issues`}
          className="underline decoration-white/20 underline-offset-2 hover:text-(--ink)"
        >
          open an issue
        </a>{" "}
        if something is out of date. Product names are trademarks of their owners; {siteConfig.name}{" "}
        is not affiliated with them.
      </p>
      {sources.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          Sources:
          {sources.map((source) => (
            <SourceLink key={source} href={source}>
              {new URL(source).hostname.replace(/^www\./, "") + new URL(source).pathname}
            </SourceLink>
          ))}
        </p>
      )}
    </div>
  );
}

/** Every tool the site compares, with what it is and what it costs: the index of comparisons. */
export function AlternativesTable({ alternatives }: { alternatives: readonly Alternative[] }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/[0.08]">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Tools compared with {siteConfig.name}</caption>
        <thead className="hidden bg-white/[0.03] md:table-header-group">
          <tr>
            <th scope="col" className="w-48 px-5 py-4 font-medium text-(--ink-3)">
              Tool
            </th>
            <th scope="col" className="px-5 py-4 font-medium text-(--ink-3)">
              What it does
            </th>
            <th scope="col" className="w-72 px-5 py-4 font-medium text-(--ink-3)">
              Price
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          <tr className="flex flex-col gap-2 bg-(--glow)/[0.04] px-5 py-4 md:table-row md:p-0">
            <th scope="row" className="font-medium md:px-5 md:py-4 md:align-top">
              <span className="flex items-center gap-2">
                <LogoMark className="size-4" />
                {siteConfig.name}
              </span>
            </th>
            <td className="text-(--ink) md:px-5 md:py-4 md:align-top">
              A live screen for the office: your Stripe revenue, with sounds and celebrations.
            </td>
            <td className="text-(--ink) md:px-5 md:py-4 md:align-top">
              Free during the public beta, and free for good on your own server.
            </td>
          </tr>
          {alternatives.map((alternative) => (
            <tr
              key={alternative.slug}
              className="flex flex-col gap-2 px-5 py-4 md:table-row md:p-0"
            >
              <th scope="row" className="font-medium md:px-5 md:py-4 md:align-top">
                <Link
                  href={`/alternatives/${alternative.slug}`}
                  className="underline decoration-white/20 underline-offset-4 hover:decoration-current"
                >
                  {alternative.name}
                </Link>
              </th>
              <td className="text-(--ink-2) md:px-5 md:py-4 md:align-top">
                {alternative.summary.text}{" "}
                <SourceLink href={alternative.summary.source} className="text-xs whitespace-nowrap">
                  Source
                  <span className="sr-only">: {alternative.name}</span>
                </SourceLink>
              </td>
              <td className="text-(--ink-2) md:px-5 md:py-4 md:align-top">
                <span className="mb-1 block text-xs text-(--ink-3) md:hidden">Price</span>
                {alternative.price.text}.{" "}
                <SourceLink href={alternative.price.source} className="text-xs whitespace-nowrap">
                  Source
                  <span className="sr-only">: {alternative.name} pricing</span>
                </SourceLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

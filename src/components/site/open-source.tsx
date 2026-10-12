import { StarIcon } from "lucide-react";
import { GitHubIcon } from "@/components/brand-icons";
import { buttonClass } from "@/components/site/button-styles";
import { RichText } from "@/components/site/rich-text";
import { Container, SectionHeading } from "@/components/site/section";
import { INSTALL_COMMANDS, Terminal } from "@/components/site/terminal";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";

/** Open source and self-hosted: the license, the stars, and the two commands to run it. */
export function OpenSource({
  text,
  stars,
  links,
}: {
  text: SiteText["openSource"];
  stars: string | null;
  links: Record<string, string>;
}) {
  return (
    <section aria-labelledby="open-source-title" id="open-source" className="pt-24 sm:pt-36">
      <Container>
        <div className="reveal relative isolate overflow-hidden rounded-[2rem] bg-(--surface) p-6 shadow-(--edge) sm:p-10 lg:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[36rem] bg-[radial-gradient(closest-side,var(--glow-faint),transparent)]"
          />
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <SectionHeading
                id="open-source-title"
                eyebrow={text.eyebrow}
                title={text.title}
                lead={text.lead}
              />
              <dl className="mt-9 grid grid-cols-3 gap-4">
                {text.facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col-reverse justify-end gap-1">
                    <dt className="text-xs text-pretty text-(--ink-3)">{fact.label}</dt>
                    <dd className="text-2xl font-semibold tracking-tight">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href={siteConfig.repositoryUrl} className={buttonClass({ size: "md" })}>
                  <GitHubIcon />
                  {text.star}
                  {stars && (
                    <span className="-mr-1 flex items-center gap-1 rounded-full bg-(--screen)/10 px-2 py-0.5 text-xs tabular-nums">
                      <StarIcon aria-hidden className="size-3! fill-current" />
                      {stars}
                    </span>
                  )}
                </a>
                <a
                  href={siteConfig.selfHostingUrl}
                  className={buttonClass({ variant: "secondary", size: "md" })}
                >
                  {text.guide}
                </a>
              </div>
            </div>

            <div className="min-w-0">
              <Terminal
                commands={INSTALL_COMMANDS}
                labels={{
                  title: text.terminal,
                  copy: text.copy,
                  copied: text.copied,
                  failed: text.copyFailed,
                }}
              />
              <p className="mt-4 text-sm text-pretty text-(--ink-3)">
                <RichText text={text.script} links={links} />
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

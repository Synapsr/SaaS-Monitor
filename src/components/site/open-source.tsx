import { StarIcon } from "lucide-react";
import { Fragment } from "react";
import { GitHubIcon } from "@/components/brand-icons";
import { buttonClass } from "@/components/site/button-styles";
import { CopyText } from "@/components/site/copy-text";
import { RichText } from "@/components/site/rich-text";
import { Container, SectionHeading } from "@/components/site/section";
import { siteConfig } from "@/lib/site";
import type { SiteText } from "@/lib/site/i18n";

/**
 * The install, as docs/self-hosting.md gives it: the script is served by saas-monitor.com itself
 * (public/install.sh), so a self-hosted site shows the same commands.
 */
const INSTALL_COMMANDS = [
  "curl -fsSL https://saas-monitor.com/install.sh | sh",
  "cd saas-monitor && docker compose up -d",
];

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
              <div className="overflow-hidden rounded-2xl bg-(--screen) shadow-(--shadow-device)">
                <div className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-4 shadow-[0_1px_0_var(--hairline)]">
                  <span className="flex items-center gap-1.5" aria-hidden>
                    <span className="size-2.5 rounded-full bg-(--surface-hover)" />
                    <span className="size-2.5 rounded-full bg-(--surface-hover)" />
                    <span className="size-2.5 rounded-full bg-(--surface-hover)" />
                  </span>
                  <span className="text-xs text-(--ink-3)">{text.terminal}</span>
                  <CopyText
                    value={INSTALL_COMMANDS.join("\n")}
                    labels={{ copy: text.copy, copied: text.copied, failed: text.copyFailed }}
                  />
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[0.78rem] leading-7 text-(--ink-2) sm:p-6 sm:text-[0.84rem]">
                  <code className="flex flex-col gap-1">
                    {INSTALL_COMMANDS.map((command) => (
                      // Long commands wrap under themselves, past the prompt, on small screens.
                      <span key={command} className="pl-[2ch] -indent-[2ch] whitespace-pre-wrap">
                        <span className="text-(--glow) select-none">$ </span>
                        <CommandText command={command} />
                      </span>
                    ))}
                  </code>
                </pre>
              </div>
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

/**
 * A command that wraps only between words or after a URL's slash: cut at the hyphen of
 * saas-monitor.com, the address would read as two.
 */
function CommandText({ command }: { command: string }) {
  return command.split(" ").map((word, wordIndex) => (
    <Fragment key={wordIndex}>
      {wordIndex > 0 && " "}
      {word.split(/(?<=[^/]\/)(?=[^/])/).map((piece, pieceIndex) => (
        <Fragment key={pieceIndex}>
          {pieceIndex > 0 && <wbr />}
          <span className="whitespace-nowrap">{piece}</span>
        </Fragment>
      ))}
    </Fragment>
  ));
}

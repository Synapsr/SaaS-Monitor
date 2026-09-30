import { Fragment } from "react";
import { CopyButton } from "@/components/app/copy-button";
import { GitHubIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

/**
 * The install, as docs/self-hosting.md gives it: the script is served by saas-monitor.com itself
 * (public/install.sh), so a self-hosted landing page shows the same commands.
 */
const INSTALL_COMMANDS = [
  "curl -fsSL https://saas-monitor.com/install.sh | sh",
  "cd saas-monitor && docker compose up -d",
];

const INSTALL_SCRIPT_URL = `${siteConfig.repositoryUrl}/blob/main/public/install.sh`;

/** Open source and self-hosted: the guide, the repository and the commands to run it. */
export function SelfHost() {
  return (
    <section id="self-host" className="mx-auto max-w-6xl px-5 pt-28 sm:px-6">
      <div className="grid items-center gap-10 rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08] sm:p-8 md:grid-cols-2 md:p-12">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">Yours to run</h2>
          <p className="mt-3 text-pretty text-(--ink-2)">
            {siteConfig.name} is open source under the MIT license. Run it with Docker on your own
            server or a Raspberry Pi, in two commands, with nothing to clone or build. Your Stripe
            key stays on your server.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href={siteConfig.selfHostingUrl}>Self-hosting guide</a>
            </Button>
            <Button asChild variant="ghost">
              <a href={siteConfig.repositoryUrl}>
                <GitHubIcon className="size-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl bg-black/60 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 py-1.5 pr-1.5 pl-4">
              <span className="text-xs text-(--ink-3)">Terminal</span>
              <CopyButton
                value={INSTALL_COMMANDS.join("\n")}
                label="Copy"
                variant="ghost"
                className="text-(--ink-2)"
              />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[0.75rem] leading-6 text-(--ink-2) sm:p-5 sm:text-[0.8rem]">
              <code className="flex flex-col gap-1">
                {INSTALL_COMMANDS.map((command) => (
                  // Long commands wrap under themselves, past the prompt, on small screens.
                  <span key={command} className="pl-[2ch] -indent-[2ch] whitespace-pre-wrap">
                    <span className="text-(--ink-3) select-none">$ </span>
                    <CommandText command={command} />
                  </span>
                ))}
              </code>
            </pre>
          </div>
          <p className="mt-3 text-sm text-pretty text-(--ink-3)">
            The{" "}
            <a
              href={INSTALL_SCRIPT_URL}
              className="underline decoration-white/25 underline-offset-4 hover:text-(--ink-2)"
            >
              script
            </a>{" "}
            writes a Compose file and fresh secrets, then stops. Open localhost:3000 and connect
            Stripe. Built for amd64 and arm64.
          </p>
        </div>
      </div>
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

import { Fragment } from "react";
import { CopyText } from "@/components/site/copy-text";

/**
 * The install, as docs/self-hosting.md gives it: the script is served by saas-monitor.com itself
 * (public/install.sh), so a self-hosted site shows the same commands.
 */
export const INSTALL_COMMANDS = [
  "curl -fsSL https://saas-monitor.com/install.sh | sh",
  "cd saas-monitor && docker compose up -d",
];

/** The update, as docs/self-hosting.md gives it. */
export const UPDATE_COMMANDS = ["docker compose pull", "docker compose up -d"];

export interface TerminalLabels {
  /** The window's title: "Terminal". */
  title: string;
  copy: string;
  copied: string;
  failed: string;
}

/** Commands to run, in a terminal window with a button that copies them all. */
export function Terminal({ commands, labels }: { commands: string[]; labels: TerminalLabels }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-(--screen) shadow-(--shadow-device)">
      <div className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-4 shadow-[0_1px_0_var(--hairline)]">
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-(--surface-hover)" />
          <span className="size-2.5 rounded-full bg-(--surface-hover)" />
          <span className="size-2.5 rounded-full bg-(--surface-hover)" />
        </span>
        <span className="text-xs text-(--ink-3)">{labels.title}</span>
        <CopyText value={commands.join("\n")} labels={labels} />
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[0.78rem] leading-7 text-(--ink-2) sm:p-6 sm:text-[0.84rem]">
        <code className="flex flex-col gap-1">
          {commands.map((command) => (
            // Long commands wrap under themselves, past the prompt, on small screens.
            <span key={command} className="pl-[2ch] -indent-[2ch] whitespace-pre-wrap">
              <span className="text-(--glow) select-none">$ </span>
              <CommandText command={command} />
            </span>
          ))}
        </code>
      </pre>
    </div>
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

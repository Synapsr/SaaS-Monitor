import { siteConfig } from "@/lib/site";

const linkClass =
  "text-(--ink) underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-(--glow)";

/** Who makes it, and what else they make: open source that keeps being maintained. */
export function MakerNote() {
  return (
    <aside className="rounded-2xl bg-white/[0.03] p-6 text-sm text-pretty text-(--ink-2) ring-1 ring-white/[0.08]">
      <h3 className="font-medium text-(--ink)">Who makes it</h3>
      <p className="mt-2">
        {siteConfig.name} is made in Brest, France, by Loan Talvat and the{" "}
        <a href={siteConfig.maker.url} className={linkClass}>
          {siteConfig.maker.name}
        </a>{" "}
        team.
      </p>
      <p className="mt-2">
        We also make{" "}
        <a href="https://github.com/Synapsr/Louez" className={linkClass}>
          Louez
        </a>
        , open-source software for rental businesses, and{" "}
        <a href="https://github.com/Synapsr/Hovod" className={linkClass}>
          Hovod
        </a>
        , an open-source video platform you host yourself.
      </p>
    </aside>
  );
}

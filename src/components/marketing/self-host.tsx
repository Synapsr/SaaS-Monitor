import { GitHubIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

/** Open source and self-hosted: the guide, the repository and the commands to run it. */
export function SelfHost() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-28 sm:px-6">
      <div className="grid items-center gap-10 rounded-3xl bg-white/[0.03] p-8 ring-1 ring-white/[0.08] md:grid-cols-2 md:p-12">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">Yours to run</h2>
          <p className="mt-3 text-pretty text-(--ink-2)">
            {siteConfig.name} is open source under the MIT license. Run it on your own server with
            Docker in two commands: your Stripe data never leaves it.
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
        <pre className="overflow-x-auto rounded-xl bg-black/60 p-5 font-mono text-[0.8rem] leading-7 text-(--ink-2) ring-1 ring-white/10">
          <code>
            <span className="text-(--ink-3) select-none">$ </span>git clone{" "}
            {siteConfig.repositoryUrl}.git{"\n"}
            <span className="text-(--ink-3) select-none">$ </span>cd SaaS-Monitor && node
            scripts/setup.mjs{"\n"}
            <span className="text-(--ink-3) select-none">$ </span>docker compose up -d
          </code>
        </pre>
      </div>
    </section>
  );
}

import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

const linkClass =
  "rounded-md px-3 py-1.5 whitespace-nowrap text-(--ink-2) transition-colors hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--glow)";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-(--screen)/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight whitespace-nowrap"
        >
          <LogoMark />
          {siteConfig.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <Link href="/d/demo" className={`${linkClass} hidden sm:block`}>
            Live demo
          </Link>
          <a href={siteConfig.docsUrl} className={`${linkClass} hidden md:block`}>
            Docs
          </a>
          <a
            href={siteConfig.repositoryUrl}
            className={linkClass}
            aria-label="SaaS Monitor on GitHub"
          >
            <GitHubIcon className="size-4.5" />
          </a>
          <Link href="/sign-in" className={linkClass}>
            Sign in
          </Link>
          <Button asChild size="sm" className="ml-1 bg-(--ink) text-(--screen) hover:bg-white">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

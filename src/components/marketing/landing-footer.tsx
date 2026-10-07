import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";

/** The license, and links to the demo, the docs, the code, the dashboard and the legal pages. */
export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-(--ink-3) sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2.5">
          <LogoMark className="size-5" />
          Open source under the MIT license.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/d/demo" className="hover:text-(--ink)">
            Live demo
          </Link>
          <a href={siteConfig.docsUrl} className="hover:text-(--ink)">
            Docs
          </a>
          <a href={siteConfig.repositoryUrl} className="hover:text-(--ink)">
            GitHub
          </a>
          <Link href="/sign-in" className="hover:text-(--ink)">
            Sign in
          </Link>
          <Link href="/privacy" className="hover:text-(--ink)">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-(--ink)">
            Terms
          </Link>
          <Link href="/legal" className="hover:text-(--ink)">
            Legal notice
          </Link>
        </nav>
      </div>
    </footer>
  );
}

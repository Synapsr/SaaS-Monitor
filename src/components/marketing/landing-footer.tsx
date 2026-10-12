import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { publisher } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Live demo", href: "/d/demo" },
      { label: "Stripe notification sounds", href: "/stripe-notification-sound" },
      { label: "Alternatives", href: "/alternatives" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Open source",
    links: [
      { label: "Docs", href: siteConfig.docsUrl },
      { label: "GitHub", href: siteConfig.repositoryUrl },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Legal notice", href: "/legal" },
    ],
  },
];

/**
 * The license, who makes it and whose trademark Stripe is, then links to the product's pages, its
 * code and the legal pages.
 */
export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 text-sm text-(--ink-3) sm:px-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2.5 font-medium text-(--ink)">
            <LogoMark className="size-5" />
            {siteConfig.name}
          </p>
          <p>Open source under the MIT license.</p>
          <p>
            Made in {publisher.address.city}, {publisher.address.country}, by {publisher.name}.
          </p>
          <p className="max-w-sm text-xs text-pretty">
            Stripe is a trademark of Stripe, Inc. {siteConfig.name} is not affiliated with or
            endorsed by Stripe.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-14">
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <p className="text-(--ink-2)">{column.title}</p>
              <ul className="flex flex-col gap-2.5">
                {column.links.map(({ label, href }) => (
                  <li key={href}>
                    {href.startsWith("/") ? (
                      <Link href={href} className="transition-colors hover:text-(--ink)">
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="transition-colors hover:text-(--ink)">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}

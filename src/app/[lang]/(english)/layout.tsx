import { notFound } from "next/navigation";
import { DEFAULT_LANGUAGE } from "@/lib/site/languages";

/**
 * Pages written in English only (legal pages, changelog, comparisons): served at their address
 * without a prefix, and missing in the other languages, which link to them as English pages.
 */
export default async function EnglishOnlyLayout({ children, params }: LayoutProps<"/[lang]">) {
  if ((await params).lang !== DEFAULT_LANGUAGE) notFound();
  return children;
}

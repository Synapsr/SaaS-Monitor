import type { ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { docsPageMetadata, renderDocsPage } from "@/components/docs/docs-route";
import { DOCS_SLUGS, isDocsSlug } from "@/lib/site/docs/pages";

/** Every guide is built ahead, in every language; any other address is the site's 404. */
export const dynamicParams = false;

/** The star count in the header is GitHub's, fetched again at most every hour. */
export const revalidate = 3600;

export function generateStaticParams() {
  return DOCS_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/[lang]/docs/[slug]">,
  parent: ResolvingMetadata,
) {
  const { lang, slug } = await params;
  if (!isDocsSlug(slug)) notFound();
  return (await docsPageMetadata(lang, slug, parent)) ?? notFound();
}

export default async function DocsGuidePage({ params }: PageProps<"/[lang]/docs/[slug]">) {
  const { lang, slug } = await params;
  if (!isDocsSlug(slug)) notFound();
  return renderDocsPage(lang, slug) ?? notFound();
}

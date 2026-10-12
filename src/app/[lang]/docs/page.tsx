import type { ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { renderDocsPage, docsPageMetadata } from "@/components/docs/docs-route";

/** The star count in the header is GitHub's, fetched again at most every hour. */
export const revalidate = 3600;

export async function generateMetadata(
  { params }: PageProps<"/[lang]/docs">,
  parent: ResolvingMetadata,
) {
  return (await docsPageMetadata((await params).lang, "overview", parent)) ?? notFound();
}

export default async function DocsHomePage({ params }: PageProps<"/[lang]/docs">) {
  return renderDocsPage((await params).lang, "overview") ?? notFound();
}

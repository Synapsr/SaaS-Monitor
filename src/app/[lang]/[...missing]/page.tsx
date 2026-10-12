import { notFound } from "next/navigation";

/**
 * Any other address of the site: rendered on demand (unlike the languages, which are all built),
 * to answer with the site's 404 page (`not-found.tsx`) in the language of the address, with its
 * header and footer.
 */
export const dynamicParams = true;

export default function MissingPage(): never {
  notFound();
}

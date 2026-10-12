import { serializeJsonLd } from "@/lib/structured-data";

/** Structured data for search engines and assistants, in the page's HTML. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

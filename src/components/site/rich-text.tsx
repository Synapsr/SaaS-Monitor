import Link from "next/link";
import { Fragment } from "react";
import { textLinkClass } from "@/components/site/button-styles";
import { parseRichText } from "@/lib/site/rich-text";
import { cn } from "@/lib/utils";

/**
 * A text of the site with its links and emphasis (`[words](key)`, `**words**`): `links` says
 * where each key points. Links within the site navigate in place.
 */
export function RichText({
  text,
  links,
  linkClassName,
}: {
  text: string;
  links: Record<string, string>;
  linkClassName?: string;
}) {
  return parseRichText(text).map((part, index) => {
    if (part.type === "text") return <Fragment key={index}>{part.text}</Fragment>;
    if (part.type === "strong") {
      return (
        <strong key={index} className="font-medium text-(--ink)">
          {part.text}
        </strong>
      );
    }
    const href = links[part.key] ?? "#";
    const className = cn(textLinkClass, linkClassName);
    return href.startsWith("/") ? (
      <Link key={index} href={href} className={className}>
        {part.text}
      </Link>
    ) : (
      <a key={index} href={href} className={className}>
        {part.text}
      </a>
    );
  });
}

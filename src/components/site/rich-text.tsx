import Link from "next/link";
import { Fragment } from "react";
import { textLinkClass } from "@/components/site/button-styles";
import { parseRichText } from "@/lib/site/rich-text";
import { cn } from "@/lib/utils";

/**
 * A text of the site with its links, emphasis and code (`[words](key)`, `**words**`,
 * `` `words` ``): `links` says where each key points. Links within the site navigate in place.
 * The hosted service's domain stays on one line: browsers would break it after its hyphen.
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
    if (part.type === "text") return <Words key={index} text={part.text} />;
    if (part.type === "code") {
      return (
        <code
          key={index}
          className="rounded-md bg-(--surface-raised) box-decoration-clone px-1 py-0.5 font-mono text-[0.86em] [overflow-wrap:anywhere] text-(--ink) shadow-(--edge)"
        >
          {part.text}
        </code>
      );
    }
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

const DOMAIN = /(saas-monitor\.com)/;

function Words({ text }: { text: string }) {
  return text.split(DOMAIN).map((piece, index) =>
    index % 2 === 1 ? (
      <span key={index} className="whitespace-nowrap">
        {piece}
      </span>
    ) : (
      <Fragment key={index}>{piece}</Fragment>
    ),
  );
}

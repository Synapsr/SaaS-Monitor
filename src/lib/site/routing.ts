import { DEFAULT_LANGUAGE, isSiteLanguage } from "@/lib/site/languages";

/**
 * How the proxy routes a path of the public site. Its pages live under `app/[lang]`: English ones
 * are served without the prefix, so `/` is rewritten to `/en` and `/en/…` redirects to `/…`, and
 * the other languages keep theirs (`/fr`). The product (dashboard, sign-in, screens), the API,
 * metadata files and assets are left alone.
 *
 * - `other`: not a page of the site, served as it is.
 * - `redirect`: an English page asked for with its prefix; permanently moved to `pathname`.
 * - `page`: a page of the site (or a missing one, which it answers with its 404), served from
 *   `rewrite` when set.
 */
export type SiteRoute =
  | { kind: "other" }
  | { kind: "redirect"; pathname: string }
  | { kind: "page"; rewrite: string | null };

/** First segments that belong to the product, the API or the build, never to the site. */
const OTHER_SEGMENTS = new Set([
  "_next",
  "api",
  "app",
  "d",
  "invite",
  "sign-in",
  "sign-up",
  "sounds",
  "voices",
  ".well-known",
]);

/** Generated metadata files, also under a language (`/fr/opengraph-image`). */
const METADATA_FILES = /^(?:icon|apple-icon|opengraph-image|twitter-image)(?:[.-].*)?$/;

/** A file, such as `/robots.txt`, `/install.sh` or `/llms.txt`: its last segment has an extension. */
const FILE = /\.[a-z0-9]+$/i;

export function siteRoute(pathname: string): SiteRoute {
  const segments = pathname.split("/").filter(Boolean);
  const [first = ""] = segments;
  const last = segments.at(-1) ?? "";
  if (OTHER_SEGMENTS.has(first) || FILE.test(last)) return { kind: "other" };
  if (segments.some((segment) => METADATA_FILES.test(segment))) return { kind: "other" };

  if (first === DEFAULT_LANGUAGE) {
    return { kind: "redirect", pathname: `/${segments.slice(1).join("/")}` };
  }
  if (isSiteLanguage(first)) return { kind: "page", rewrite: null };
  return { kind: "page", rewrite: `/${DEFAULT_LANGUAGE}${pathname === "/" ? "" : pathname}` };
}

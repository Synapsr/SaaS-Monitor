/**
 * What analytics may learn of a URL. A screen's link is its access token (`/d/<token>`), dashboard
 * URLs carry ids, and query strings carry redirects and invitation links: none of it may reach the
 * analytics server. Pages keep their path, with ids replaced by `:id`, and only the query
 * parameters that say where a visitor came from.
 */

/** The parameters Plausible reads to attribute a visit to a source or a campaign. */
const ATTRIBUTION_PARAMS = new Set([
  "ref",
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

/** Longer values are cut: a campaign name, not a payload. */
const MAX_PARAM_LENGTH = 100;

/** Routes whose next segment is an id: `/app/screens/<id>`, `/invite/<id>`. */
const ID_PARENTS = new Set(["/app/screens", "/invite"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Random ids and tokens: long, with a digit or a capital letter. Slugs such as
 * `stripe-notification-sound` are lowercase words.
 */
const TOKEN = /^(?=.*[\dA-Z])[\w-]{16,}$/;

const REDACTED = ":id";

/**
 * The path analytics may see: ids redacted, or `null` for pages that are never tracked, screens
 * first (the demo excepted).
 */
export function analyticsPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const [first, second] = segments;
  if (first === "api" || first === "_next") return null;
  if (first === "d" && !(second === "demo" && segments.length === 2)) return null;

  const redacted = segments.map((segment, index) => {
    const parent = `/${segments.slice(0, index).join("/")}`;
    return ID_PARENTS.has(parent) || UUID.test(segment) || TOKEN.test(segment) ? REDACTED : segment;
  });
  return `/${redacted.join("/")}`;
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** The URL of a page as analytics may see it, or `null` when the page is not tracked. */
export function analyticsUrl(href: string): string | null {
  const url = parseHttpUrl(href);
  const path = url && analyticsPath(url.pathname);
  if (!url || path === null) return null;

  const query = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (ATTRIBUTION_PARAMS.has(key)) query.append(key, value.slice(0, MAX_PARAM_LENGTH));
  }
  const search = query.toString();
  return `${url.origin}${path}${search ? `?${search}` : ""}`;
}

/**
 * The referrer of a visit as analytics may see it. Another site keeps its origin and path (a
 * subreddit, a blog post) but not its query string; a page of this site is redacted like `page`.
 */
export function analyticsReferrer(
  referrer: string | null | undefined,
  page: string,
): string | null {
  const url = referrer ? parseHttpUrl(referrer) : null;
  if (!url) return null;
  if (url.origin !== parseHttpUrl(page)?.origin) return `${url.origin}${url.pathname}`;
  return analyticsUrl(url.href) ?? `${url.origin}/`;
}

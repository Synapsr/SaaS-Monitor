const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

/**
 * Returns `value` when it is a path on this site (e.g. `/app/screens?tab=1`), `fallback` otherwise.
 * `?next=` parameters go through it so that a crafted link can never send someone to another site
 * after signing in (open redirect): `//evil.example`, `/\evil.example` or `https://…` are refused.
 */
export function safeRedirectPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  try {
    // Resolving against a fixed origin normalises every trick browsers accept (backslashes, tabs,
    // protocol-relative URLs): anything that escapes this origin is not a local path.
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    // Dot segments can also normalise into `//host` (`/.//evil.example`): a leading double slash
    // would make the returned path protocol-relative.
    if (url.origin !== PLACEHOLDER_ORIGIN || url.pathname.startsWith("//")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** `/sign-in?next=…`, leaving the parameter out when it points to the default destination. */
export function withRedirect(path: string, next: string, fallback = "/app"): string {
  return next === fallback ? path : `${path}?next=${encodeURIComponent(next)}`;
}

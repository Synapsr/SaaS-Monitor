/**
 * A screen's link, `https://<instance>/d/<token>`: the instance answering for it, and its token.
 * Instances may live under a sub-path (`https://acme.dev/monitor/d/<token>`), or on a local
 * network (`http://192.168.1.20:3000/d/<token>`).
 */
export interface ScreenLink {
  /** Origin of the instance and its path, without trailing slash: `https://saas-monitor.com`. */
  baseUrl: string;
  token: string;
}

/** The web's demo screen, `/d/demo`: simulated in the app, with no instance behind it. */
export const DEMO_TOKEN = "demo";

/** Screen tokens are base64url (`generatePublicToken` on the server), 32 characters today. */
const TOKEN = /^[A-Za-z0-9_-]{4,256}$/;

/** Scheme, then host (and port), then path; the query and fragment are left out. */
const URL_PARTS = /^(https?):\/\/(?:[^@/?#\s]*@)?([^/?#\s]+)([^?#\s]*)/i;

/**
 * Reads a screen link, scanned or pasted, possibly inside a sentence ("Open https://… on your
 * phone") or without its scheme. `null` for anything that isn't one.
 */
export function parseScreenLink(input: string): ScreenLink | null {
  const text = input.trim();
  const candidate = text.match(/https?:\/\/\S+/i)?.[0] ?? text;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  const parts = URL_PARTS.exec(withScheme);
  if (!parts) return null;

  const [, scheme, host, path] = parts;
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host) && !/^\[[0-9a-f:.]+\](:\d{1,5})?$/i.test(host)) {
    return null;
  }
  const segments = path.split("/").filter(Boolean);
  // The last `d` segment followed by the token: a sub-path could itself contain a `d`.
  const index = segments.lastIndexOf("d");
  if (index === -1 || index !== segments.length - 2) return null;
  const token = decodeSegment(segments[index + 1]);
  if (token === null || !TOKEN.test(token)) return null;

  const prefix = segments.slice(0, index).map((segment) => `/${segment}`).join("");
  return { baseUrl: `${scheme.toLowerCase()}://${host.toLowerCase()}${prefix}`, token };
}

function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/** The link of a screen, as its instance writes it. */
export function screenUrl({ baseUrl, token }: ScreenLink): string {
  return `${baseUrl}/d/${encodeURIComponent(token)}`;
}

/** Where an instance lives, short enough for a list: `saas-monitor.com`, `acme.dev/monitor`. */
export function instanceLabel(baseUrl: string): string {
  return baseUrl.replace(/^https:\/\//i, "");
}

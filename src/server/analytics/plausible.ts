import "server-only";
import type { RelayedEvent } from "@/server/analytics/event";
import { clientAddress } from "@/server/rate-limit";

const TIMEOUT_MS = 5_000;
/** Plausible serves its script with a one-day cache: this server keeps it as long. */
const SCRIPT_LIFETIME_MS = 24 * 60 * 60 * 1_000;

let script: { host: string; body: string; expiresAt: number } | undefined;
let fetching: Promise<string | null> | undefined;

/**
 * Plausible's script, the version with manual pageviews: the app sends them itself, with redacted
 * URLs. Fetched once a day by this server and served from its own origin, so that browsers never
 * contact Plausible and the Content-Security-Policy stays `'self'`. `null` when Plausible cannot
 * be reached and no copy is at hand.
 */
export async function plausibleScript(host: string): Promise<string | null> {
  if (script?.host === host && script.expiresAt > Date.now()) return script.body;

  fetching ??= fetch(`${host}/js/script.manual.js`, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Plausible answered ${response.status}`);
      const body = await response.text();
      script = { host, body, expiresAt: Date.now() + SCRIPT_LIFETIME_MS };
      return body;
    })
    .catch((error: unknown) => {
      console.warn("Could not fetch Plausible's script:", error);
      // A stale copy is better than no analytics.
      return script?.host === host ? script.body : null;
    })
    .finally(() => {
      fetching = undefined;
    });
  return fetching;
}

/**
 * Sends an event to Plausible for the visitor who made `request`. Plausible tells visitors apart
 * with their address and browser (hashed with a daily salt, no cookie), and drops events that
 * seem to come from a server: both are passed on.
 */
export async function sendPlausibleEvent(
  host: string,
  event: RelayedEvent,
  request: Request,
): Promise<Response> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("User-Agent", userAgent);
  const address = clientAddress(request.headers);
  if (address !== "unknown") headers.set("X-Forwarded-For", address);

  try {
    const response = await fetch(`${host}/api/event`, {
      method: "POST",
      headers,
      body: JSON.stringify(event),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Plausible says when it ignored an event (a bot, a blocked address): useful when debugging.
    const dropped = response.headers.get("x-plausible-dropped");
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") ?? "text/plain",
        ...(dropped ? { "X-Plausible-Dropped": dropped } : {}),
      },
    });
  } catch {
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

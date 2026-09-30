import { analyticsConfig } from "@/server/analytics/config";
import { sanitizeEvent } from "@/server/analytics/event";
import { sendPlausibleEvent } from "@/server/analytics/plausible";
import { clientAddress, createRateLimiter } from "@/server/rate-limit";

// Read at request time: a published image turns analytics on with an environment variable.
export const dynamic = "force-dynamic";

/** An event is a few hundred bytes. */
const MAX_BODY_LENGTH = 4_096;
/** A visitor sends a pageview, an engagement event or two per page: generous for an office. */
const limiter = createRateLimiter({ limit: 120, windowMs: 60_000 });

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Whether browsers should load analytics, and for which site: `{ "domain": null }` when they are
 * off. The same for everyone, so it may be cached for a while.
 */
export function GET() {
  const config = analyticsConfig();
  return Response.json(
    { domain: config?.domain ?? null },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}

/** Relays an event of Plausible's script to Plausible, redacted (see `sanitizeEvent`). */
export async function POST(request: Request) {
  const config = analyticsConfig();
  if (!config) return new Response(null, { status: 404, headers: NO_STORE });
  if (!limiter.consume(clientAddress(request.headers))) {
    return new Response(null, { status: 429, headers: NO_STORE });
  }

  // The script posts JSON as text/plain, which needs no CORS preflight.
  const body = await request.text();
  if (body.length > MAX_BODY_LENGTH) return new Response(null, { status: 413, headers: NO_STORE });
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    json = null;
  }

  const result = sanitizeEvent(json, config.domain);
  if (!result.ok) {
    // Untracked pages get the answer Plausible gives to events it ignores.
    return new Response(null, {
      status: result.reason === "invalid" ? 400 : 202,
      headers: NO_STORE,
    });
  }
  return sendPlausibleEvent(config.host, result.event, request);
}

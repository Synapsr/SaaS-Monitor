import { analyticsConfig } from "@/server/analytics/config";
import { plausibleScript } from "@/server/analytics/plausible";

// Read at request time: a published image turns analytics on with an environment variable.
export const dynamic = "force-dynamic";

/** Plausible's script, served from this origin (see `plausibleScript`). */
export async function GET() {
  const config = analyticsConfig();
  if (!config) return new Response(null, { status: 404 });

  const script = await plausibleScript(config.host);
  if (!script) return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  return new Response(script, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

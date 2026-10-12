import { env } from "@/env";

export const dynamic = "force-dynamic";

/**
 * Whether visitors of the site can write to the instance's team, and how: Gleap's SDK key
 * (`GLEAP_API_KEY`, public by nature, as browsers read it), or `null`. The site's pages are built
 * ahead, without the instance's settings, so its help button asks once a page is up.
 */
export function GET() {
  return Response.json(
    { gleap: env().GLEAP_API_KEY ?? null },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}

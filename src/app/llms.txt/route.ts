import { appUrl } from "@/env";
import { llmsTxt } from "@/lib/llms-txt";

// Rendered at build time, like the landing page it describes: GET handlers are dynamic otherwise.
export const dynamic = "force-static";

/** Markdown, served as plain text so that browsers show it rather than download it. */
export function GET() {
  return new Response(llmsTxt(appUrl()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { appUrl } from "@/env";
import { llmsFullTxt } from "@/lib/llms-txt";

// Rendered at build time from the docs, which the build needs (`.dockerignore` lets them in) and
// the server running it does not.
export const dynamic = "force-static";

const DOCS = ["stripe.md", "wall-display.md", "self-hosting.md"];

/** `llms.txt` and every doc, as plain text: for assistants that read a project whole. */
export async function GET() {
  const docs = await Promise.all(
    DOCS.map(async (name) => ({
      title: `docs/${name}`,
      markdown: await readFile(path.join(process.cwd(), "docs", name), "utf8"),
    })),
  );
  return new Response(llmsFullTxt(appUrl(), docs), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parseChangelog, type Changelog } from "@/lib/marketing/changelog";

/**
 * CHANGELOG.md, read when `/changelog` and its feed are prerendered: the build needs the file
 * (`.dockerignore` lets it into Docker builds), the server running them does not.
 */
export const readChangelog = cache(async (): Promise<Changelog> => {
  const markdown = await readFile(path.join(process.cwd(), "CHANGELOG.md"), "utf8");
  return parseChangelog(markdown);
});

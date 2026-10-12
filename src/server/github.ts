import "server-only";
import { siteConfig } from "@/lib/site";

/** The API address of the repository: `Synapsr/SaaS-Monitor`. */
const REPOSITORY_API_URL = siteConfig.repositoryUrl.replace(
  "https://github.com/",
  "https://api.github.com/repos/",
);

/**
 * How many stars the repository has, fetched by the server (the site's Content-Security-Policy
 * keeps browsers from calling GitHub) and kept for an hour: pages that show it are regenerated
 * hourly. `null` when GitHub can't say, offline builds included: the site then shows no number
 * rather than a stale or made-up one.
 */
export async function repositoryStars(): Promise<number | null> {
  try {
    const response = await fetch(REPOSITORY_API_URL, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": siteConfig.name },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const { stargazers_count: stars } = (await response.json()) as { stargazers_count?: unknown };
    return typeof stars === "number" && Number.isInteger(stars) && stars >= 0 ? stars : null;
  } catch {
    return null;
  }
}

/**
 * A handful of stars reads as an empty room: the count shows from this many on. Until then, the
 * site asks for a star without a number.
 */
const STARS_WORTH_SHOWING = 50;

/** The repository's stars when they speak for the project, else `null`. */
export async function shownStars(): Promise<number | null> {
  const stars = await repositoryStars();
  return stars !== null && stars >= STARS_WORTH_SHOWING ? stars : null;
}

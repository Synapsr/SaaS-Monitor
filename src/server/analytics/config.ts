import "server-only";
import { z } from "zod";

/** One domain, or several separated by commas: Plausible then counts in each of their sites. */
const SITE_DOMAINS = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*(?:,[a-z0-9-]+(?:\.[a-z0-9-]+)*)*$/;

const schema = z.object({
  PLAUSIBLE_DOMAIN: z
    .string()
    .transform((value) => value.replace(/\s+/g, "").toLowerCase())
    .pipe(
      z.string().regex(SITE_DOMAINS, "must be the site's domain in Plausible, e.g. example.com"),
    )
    .optional(),
  PLAUSIBLE_HOST: z
    .url({ protocol: /^https?$/, error: "must be the http(s) URL of a Plausible server" })
    .default("https://plausible.io")
    .transform((url) => url.replace(/\/+$/, "")),
});

export interface AnalyticsConfig {
  /** The site in Plausible, sent with every event whatever a browser says. */
  domain: string;
  /** Plausible's server: plausible.io, or a self-hosted Community Edition. */
  host: string;
}

/**
 * Analytics settings from environment variables, `null` when `PLAUSIBLE_DOMAIN` is not set: then
 * nothing is loaded and nothing is sent. Separate from `env()` so that a mistake here only
 * breaks analytics, never the app.
 */
export function parseAnalyticsConfig(
  variables: Record<string, string | undefined>,
): AnalyticsConfig | null {
  // Compose files commonly pass unset variables as empty strings: treat them as missing.
  const present = (value: string | undefined) => (value?.trim() ? value : undefined);
  const result = schema.safeParse({
    PLAUSIBLE_DOMAIN: present(variables.PLAUSIBLE_DOMAIN),
    PLAUSIBLE_HOST: present(variables.PLAUSIBLE_HOST),
  });
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid analytics configuration:\n${issues}\nSee .env.example.`);
  }
  const { PLAUSIBLE_DOMAIN: domain, PLAUSIBLE_HOST: host } = result.data;
  return domain ? { domain, host } : null;
}

let cached: { config: AnalyticsConfig | null } | undefined;

/**
 * Read at request time, never at build time: a published image turns analytics on at runtime.
 * A mistake in the variables is logged once and leaves analytics off, rather than failing a
 * request of every visitor.
 */
export function analyticsConfig(): AnalyticsConfig | null {
  if (!cached) {
    try {
      cached = { config: parseAnalyticsConfig(process.env) };
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      cached = { config: null };
    }
  }
  return cached.config;
}

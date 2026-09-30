import type { SocialProvider } from "@/lib/social-providers";

/**
 * Custom events, named as Plausible shows them: goals are created there with these exact names.
 * Their properties are strings, never anything that identifies a person, a workspace or a screen.
 */
export interface AnalyticsEvents {
  /** The standalone demo opened (not the muted preview on the landing page). */
  "Demo opened": undefined;
  /** Sound started on the standalone demo: usually the visitor's first click. */
  "Demo sound on": undefined;
  /** An account created, by a founder or by a teammate accepting an invitation. */
  Signup: { method: "email" | SocialProvider; invited: "yes" | "no" };
  /** A Stripe account connected to a workspace. */
  "Stripe connected": undefined;
  /** A test celebration sent to a screen from its settings. */
  "Test celebration": undefined;
  /** The landing page's "Hear it" button, which plays the demo's sounds. */
  "Hear it": undefined;
}

export type AnalyticsEvent = keyof AnalyticsEvents;

/** Pageviews, and the engagement events Plausible's script sends when a visitor leaves a page. */
export type PlausibleEvent = AnalyticsEvent | "pageview" | "engagement";

const EVENTS = {
  "Demo opened": true,
  "Demo sound on": true,
  Signup: true,
  "Stripe connected": true,
  "Test celebration": true,
  "Hear it": true,
  pageview: true,
  engagement: true,
} satisfies Record<PlausibleEvent, true>;

/** Every event the app sends: the server relays these and nothing else. */
export const PLAUSIBLE_EVENTS = Object.keys(EVENTS) as PlausibleEvent[];

/**
 * Events that happen without the visitor doing anything. Plausible must not count them as an
 * interaction: a visit with nothing else is still a bounce.
 */
export const PASSIVE_EVENTS: ReadonlySet<PlausibleEvent> = new Set(["Demo opened"]);

/**
 * First-party paths of the Plausible script and of its event endpoint, proxied by this server.
 * Neutral names: blockers stop requests whose path says "analytics" or "plausible".
 */
export const ANALYTICS_SCRIPT_PATH = "/js/pa.js";
export const ANALYTICS_API_PATH = "/api/pa";

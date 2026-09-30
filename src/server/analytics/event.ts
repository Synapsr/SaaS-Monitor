import "server-only";
import { z } from "zod";
import { PLAUSIBLE_EVENTS } from "@/lib/analytics/events";
import { analyticsReferrer, analyticsUrl } from "@/lib/analytics/redact";

/**
 * An event as Plausible's script posts it (short field names). Fields the app does not use, such
 * as `m` (free-form metadata), are dropped.
 */
const browserEventSchema = z.object({
  /** Name. */
  n: z.enum(PLAUSIBLE_EVENTS),
  /** Page URL. */
  u: z.string().max(2_000),
  /** Referrer. */
  r: z.string().max(2_000).nullish(),
  /** Custom properties: Plausible accepts 30 at most. */
  p: z
    .record(z.string().max(100), z.string().max(200))
    .refine((props) => Object.keys(props).length <= 30)
    .optional(),
  /** `false` for events that do not count as an interaction (bounce rate). */
  i: z.boolean().optional(),
  /** Script version. */
  v: z.number().int().nonnegative().optional(),
  /** Engagement events: how far the visitor scrolled (%) and how long they stayed (ms). */
  sd: z.number().nonnegative().optional(),
  e: z.number().nonnegative().optional(),
});

export type RelayedEvent = z.infer<typeof browserEventSchema> & { d: string };

export type SanitizedEvent =
  | { ok: true; event: RelayedEvent }
  /** `untracked`: a page analytics must not see, such as a screen. */
  | { ok: false; reason: "invalid" | "untracked" };

/**
 * What the relay passes on to Plausible for a browser's event: only the app's events, for this
 * site's domain (the relay is not an open proxy), with the page and the referrer redacted again.
 * Browsers already redact them; the server does not rely on it.
 */
export function sanitizeEvent(body: unknown, domain: string): SanitizedEvent {
  const parsed = browserEventSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const url = analyticsUrl(parsed.data.u);
  if (!url) return { ok: false, reason: "untracked" };
  return {
    ok: true,
    event: { ...parsed.data, d: domain, u: url, r: analyticsReferrer(parsed.data.r, url) },
  };
}

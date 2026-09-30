import {
  ANALYTICS_API_PATH,
  ANALYTICS_SCRIPT_PATH,
  PASSIVE_EVENTS,
  type AnalyticsEvent,
  type AnalyticsEvents,
  type PlausibleEvent,
} from "@/lib/analytics/events";
import { analyticsUrl } from "@/lib/analytics/redact";

/**
 * Plausible, loaded in the browser only when the server has it (`PLAUSIBLE_DOMAIN`): self-hosted
 * instances load nothing and send nothing. Every call is a no-op on the server, on screens and in
 * frames (the landing page's demo, the screen editor's preview), and never throws.
 */

interface PlausibleOptions {
  /** The page's URL, redacted: Plausible's script would otherwise send `location.href`. */
  u: string;
  props?: Record<string, string>;
  /** `false` for events the visitor did not trigger (see `PASSIVE_EVENTS`). */
  interactive?: false;
}

type Plausible = ((event: PlausibleEvent, options: PlausibleOptions) => void) & {
  q?: unknown[][];
};

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

let loading: Promise<boolean> | undefined;

/**
 * Asks the server whether analytics are on, then loads the script once. The answer comes from the
 * server rather than the page: pages are prerendered when the app is built, and a published image
 * must be able to turn analytics on with an environment variable.
 */
function loadPlausible(): Promise<boolean> {
  loading ??= fetch(ANALYTICS_API_PATH)
    .then((response) => (response.ok ? response.json() : null))
    .then((config: { domain?: unknown } | null) => {
      if (typeof config?.domain !== "string") return false;
      if (!window.plausible) {
        // Calls made before the script runs wait in the queue it reads when it starts.
        const queue: unknown[][] = [];
        window.plausible = Object.assign((...call: unknown[]) => void queue.push(call), {
          q: queue,
        });
      }
      const script = document.createElement("script");
      script.src = ANALYTICS_SCRIPT_PATH;
      script.defer = true;
      script.dataset.domain = config.domain;
      script.dataset.api = ANALYTICS_API_PATH;
      document.head.append(script);
      return true;
    })
    .catch(() => false);
  return loading;
}

/** The current page's URL as analytics may see it, or `null` where nothing is tracked. */
function trackedPageUrl(): string | null {
  if (typeof window === "undefined" || window.self !== window.top) return null;
  return analyticsUrl(window.location.href);
}

function send(event: PlausibleEvent, props?: Record<string, string>): void {
  // Read now: by the time the script is loaded, the app may have moved to another page.
  const url = trackedPageUrl();
  if (!url) return;
  const options: PlausibleOptions = { u: url };
  if (props) options.props = props;
  if (PASSIVE_EVENTS.has(event)) options.interactive = false;
  void loadPlausible().then((enabled) => {
    if (enabled) window.plausible?.(event, options);
  });
}

/** Counts a view of the current page. */
export function trackPageview(): void {
  send("pageview");
}

/** Counts `event`, e.g. `track("Signup", { invited: "no" })`. */
export function track<E extends AnalyticsEvent>(
  event: E,
  ...[props]: AnalyticsEvents[E] extends undefined ? [] : [AnalyticsEvents[E]]
): void {
  send(event, props);
}

type EventWithoutProps = {
  [E in AnalyticsEvent]: AnalyticsEvents[E] extends undefined ? E : never;
}[AnalyticsEvent];

/**
 * Whether `error` is Next.js's redirect into the dashboard. A server action that ends with
 * `redirect()` rejects its call in the browser with it; a redirect elsewhere (to sign in, when the
 * session expired) is not a success.
 */
export function isDashboardRedirect(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  if (typeof error.digest !== "string") return false;
  // `NEXT_REDIRECT;<replace|push>;<destination>;<status>;`
  const [code, , destination] = error.digest.split(";");
  return code === "NEXT_REDIRECT" && /^\/app(?:[/?#]|$)/.test(destination ?? "");
}

/**
 * Counts `event` when a server action succeeds by redirecting into the dashboard (connecting a
 * Stripe account), then passes the redirect on to the router.
 */
export async function trackRedirect<T>(action: Promise<T>, event: EventWithoutProps): Promise<T> {
  try {
    return await action;
  } catch (error) {
    if (isDashboardRedirect(error)) track(event);
    throw error;
  }
}

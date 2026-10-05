/**
 * A screen of the app, as its widgets, watch apps and complications need it to fetch the screen's
 * state themselves (`GET {baseUrl}/api/screens/{token}/state`, see AGENTS.md).
 */
export interface SharedScreen {
  /** Stable and opaque: the first 16 hex characters of the SHA-256 of `token`. */
  key: string;
  name: string;
  /** Origin of the SaaS Monitor instance, without trailing slash: `https://saas-monitor.com`. */
  baseUrl: string;
  token: string;
  /** Proof of the screen's password, sent as `X-Screen-Access`; `null` for a screen without. */
  accessProof: string | null;
}

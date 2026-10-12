import type Gleap from "gleap";

export type GleapSdk = typeof Gleap;

export interface GleapOptions {
  /** Gleap's own button: off where the page shows its own (the site). */
  launcher?: boolean;
  /** The widget's language, as Gleap names it ("fr"); the browser's otherwise. */
  language?: string;
}

let started: Promise<GleapSdk> | null = null;

/**
 * Gleap's help widget (`GLEAP_API_KEY`), loaded and started once per page whatever asks for it,
 * resolved once it is ready to open. The site and the dashboard are separate documents, so a page
 * only ever starts it with one set of options.
 */
export function startGleap(
  sdkKey: string,
  { launcher = true, language }: GleapOptions = {},
): Promise<GleapSdk> {
  started ??= import("gleap").then(
    ({ default: gleap }) =>
      new Promise<GleapSdk>((resolve) => {
        // What a conversation needs, nothing more: no cookie, no page tracking, and neither the
        // console nor the page's own requests in bug reports, as the dashboard's carry revenue
        // figures.
        gleap.setUseCookies(false);
        gleap.setDisablePageTracking(true);
        gleap.disableConsoleLogOverwrite();
        gleap.setNetworkLogsBlacklist([window.location.origin]);
        gleap.setColorScheme("auto");
        if (language) gleap.setLanguage(language);
        gleap.showFeedbackButton(launcher);
        gleap.on("initialized", () => resolve(gleap));
        gleap.initialize(sdkKey);
      }),
  );
  return started;
}

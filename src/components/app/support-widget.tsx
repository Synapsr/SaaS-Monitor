"use client";

import type Gleap from "gleap";
import { useEffect } from "react";

interface SupportWidgetProps {
  /** The Gleap project's SDK key, from `GLEAP_API_KEY`. */
  sdkKey: string;
  user: { id: string; name: string; email: string };
}

let loading: Promise<typeof Gleap> | null = null;

/** Loads and starts the SDK once per page, whatever re-renders or remounts the widget. */
function startGleap(sdkKey: string): Promise<typeof Gleap> {
  loading ??= import("gleap").then(({ default: gleap }) => {
    // What a conversation needs, nothing more: no cookie, no page tracking, and neither the
    // console nor the dashboard's own requests in bug reports, as they carry revenue figures.
    gleap.setUseCookies(false);
    gleap.setDisablePageTracking(true);
    gleap.disableConsoleLogOverwrite();
    gleap.setNetworkLogsBlacklist([window.location.origin]);
    gleap.setColorScheme("auto");
    gleap.initialize(sdkKey);
    return gleap;
  });
  return loading;
}

/**
 * Gleap's help widget, on the dashboard of an instance that sets `GLEAP_API_KEY`: people write to
 * its team from there, who see who is writing. Only the dashboard loads it, once the page is up:
 * the public site and the screens load no third-party script.
 */
export function SupportWidget({ sdkKey, user }: SupportWidgetProps) {
  const { id, name, email } = user;
  useEffect(() => {
    void startGleap(sdkKey)
      .then((gleap) => gleap.identify(id, { name, email }))
      // Support is a convenience: the dashboard works the same without it.
      .catch(() => {});
  }, [sdkKey, id, name, email]);
  return null;
}

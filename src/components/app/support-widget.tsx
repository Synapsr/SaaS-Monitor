"use client";

import { useEffect } from "react";
import { startGleap } from "@/lib/gleap";

interface SupportWidgetProps {
  /** The Gleap project's SDK key, from `GLEAP_API_KEY`. */
  sdkKey: string;
  user: { id: string; name: string; email: string };
}

/**
 * Gleap's help widget, on the dashboard of an instance that sets `GLEAP_API_KEY`: people write to
 * its team from there, who see who is writing. It loads once the page is up; the site loads it
 * only when asked (`SiteSupport`), and the screens never do.
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

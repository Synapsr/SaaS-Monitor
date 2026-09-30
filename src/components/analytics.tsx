"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { readSignupMark } from "@/lib/analytics/signup";
import { track, trackPageview } from "@/lib/analytics/track";

/**
 * Counts a pageview on every page change, with ids removed from its URL, and the sign-ups made
 * with GitHub or Google where they land (see `signup.ts`). Renders nothing, and does nothing on
 * screens, in frames or when the server has no analytics (see `track.ts`).
 */
export function Analytics() {
  const pathname = usePathname();
  // Development runs effects twice: one view is one view.
  const counted = useRef<string | null>(null);

  useEffect(() => {
    // The mark goes whether analytics are on or not: it has no use once the page is open.
    const signup = readSignupMark(window.location.href);
    if (!signup) return;
    window.history.replaceState(null, "", signup.path);
    track("Signup", { method: signup.method, invited: signup.invited ? "yes" : "no" });
  }, []);

  useEffect(() => {
    if (counted.current === pathname) return;
    counted.current = pathname;
    trackPageview();
  }, [pathname]);

  return null;
}

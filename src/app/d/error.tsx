"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { ScreenMessage } from "@/components/display/screen-message";

const RETRY_DELAY_MS = 30_000;

/**
 * A screen that failed to render (e.g. the database was restarting) retries on its own: nobody
 * is around to click a button, and a TV must never stay stuck on an error.
 */
export default function DisplayError({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    let timer: ReturnType<typeof setTimeout>;
    const attempt = async () => {
      try {
        // Retrying while the server is down would replace this page with the browser's own
        // error page, which never recovers: wait until it answers.
        const response = await fetch(window.location.href, { method: "HEAD", cache: "no-store" });
        if (response.ok) {
          retry();
          return;
        }
      } catch {
        // Still unreachable.
      }
      timer = setTimeout(attempt, RETRY_DELAY_MS);
    };
    timer = setTimeout(attempt, RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [error, retry]);

  return (
    <div className="display fixed inset-0 flex overflow-hidden">
      <ScreenMessage
        icon={<RefreshCw className="motion-safe:animate-[spin_3s_linear_infinite]" />}
        tone="neutral"
        title="Reconnecting…"
      >
        <p>This screen could not load its data. It will try again by itself in a moment.</p>
      </ScreenMessage>
    </div>
  );
}

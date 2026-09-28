"use client";

import { useEffect, useRef, useState } from "react";
import { PREVIEW_MESSAGE_TYPE, type PreviewMessage } from "@/lib/display/preview";
import type { ScreenSettings } from "@/lib/screens/settings";
import { cn } from "@/lib/utils";
import { ScreenThumbnail } from "./screen-thumbnail";

/** Displays are designed for a 1080p TV: render at that size, then scale down. */
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

/**
 * The real display (`/d/<token>?preview=1`) scaled down to its container. Unsaved settings are
 * posted to it (see `src/lib/display/preview.ts`) so that it reacts instantly to every change.
 */
export function ScreenPreview({
  token,
  name,
  settings,
  className,
}: {
  token: string;
  name: string;
  settings: ScreenSettings;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);
  // Tracks which link finished loading, so a regenerated link fades in again.
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const loaded = loadedToken === token;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / FRAME_WIDTH),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // The frame may finish loading before hydration, when React cannot see its load event. The
  // initial about:blank document is "complete" too, so check which page is loaded.
  useEffect(() => {
    const frame = frameRef.current;
    const loadedPage = frame?.contentWindow?.location.href ?? "about:blank";
    if (frame?.contentDocument?.readyState === "complete" && loadedPage !== "about:blank") {
      setLoadedToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (!loaded) return;
    const message: PreviewMessage = { type: PREVIEW_MESSAGE_TYPE, name, settings };
    const post = () =>
      frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
    post();
    // The display can still be hydrating when its load event fires, and would miss the first
    // message: repeat it shortly after (applying the same settings twice is harmless).
    const retries = [300, 1500].map((delay) => setTimeout(post, delay));
    return () => retries.forEach(clearTimeout);
  }, [loaded, name, settings]);

  return (
    // A thin bezel makes it read as a TV, and separates it from dark pages.
    <div
      className={cn(
        "rounded-xl bg-neutral-900 p-1.5 shadow-sm ring-1 ring-black/10 dark:ring-white/10",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="relative isolate aspect-video overflow-hidden rounded-md bg-neutral-950"
      >
        <ScreenThumbnail
          accent={settings.accent}
          className={cn("absolute inset-0 transition-opacity duration-500", loaded && "opacity-0")}
        />
        <iframe
          key={token}
          ref={frameRef}
          src={`/d/${token}?preview=1`}
          title={`Live preview of ${name}`}
          tabIndex={-1}
          onLoad={() => setLoadedToken(token)}
          className={cn(
            "pointer-events-none absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
